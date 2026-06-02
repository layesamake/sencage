import { db } from '../../../database/db';
import type { Commande, CommandeLigne, CommandeStatut, PaiementStatut } from '../../../types';
import { StockService } from '../../stock/services/stockService';
import { FinancesService } from '../../finances/services/financesService';

export class CommandesService {
  static async getCommandes(): Promise<Commande[]> {
    const list = await db.commandes.toArray();
    for (const cmd of list) {
      cmd.lignes = await db.commandeLignes.where('commandeId').equals(cmd.id).toArray();
    }
    return list;
  }

  static async getCommandeById(id: string): Promise<Commande | undefined> {
    const cmd = await db.commandes.get(id);
    if (cmd) {
      cmd.lignes = await db.commandeLignes.where('commandeId').equals(cmd.id).toArray();
    }
    return cmd;
  }

  /**
   * Crée une commande client
   */
  static async createCommande(
    cmdData: Omit<Commande, 'id' | 'numero' | 'statutCommande' | 'statutPaiement' | 'createdAt' | 'lignes'>,
    lignes: Omit<CommandeLigne, 'id' | 'commandeId'>[],
    montantPaye: number,
    comptePaiement?: 'caisse' | 'wave' | 'orange_money'
  ): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date();

    // Génération du numéro CMD-YYMMDD-XXX
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const count = await db.commandes.count();
    const numero = `CMD-${dateStr}-${String(count + 1).padStart(3, '0')}`;

    // Calcul du total de la commande
    let totalArticles = 0;
    for (const l of lignes) {
      totalArticles += l.quantite * l.prixVenteReel;
    }
    const totalCommande = totalArticles - cmdData.remiseGlobale + cmdData.fraisLivraison;

    // Détermination du statut de paiement initial
    let statutPaiement: PaiementStatut = 'non_payee';
    if (montantPaye >= totalCommande) {
      statutPaiement = 'payee';
    } else if (montantPaye > 0) {
      statutPaiement = 'partiellement_payee';
    }

    // Détermination du statut de commande (vérification préliminaire des stocks)
    let statutCommande: CommandeStatut = 'confirmee';
    
    // Insérer la commande
    const newCmd: Commande = {
      ...cmdData,
      id,
      numero,
      statutCommande,
      statutPaiement,
      createdAt: now,
      lignes: []
    };
    await db.commandes.add(newCmd);

    // Enregistrer les lignes
    for (const l of lignes) {
      await db.commandeLignes.add({
        ...l,
        id: crypto.randomUUID(),
        commandeId: id
      });
    }

    // Effectuer les réservations de stock si possible
    await this.tenterReservationStock(id);

    // Enregistrer le paiement dans la trésorerie s'il y a un acompte
    if (montantPaye > 0 && comptePaiement) {
      await FinancesService.addOperation({
        type: 'encaissement',
        compteSource: 'none',
        compteDestination: comptePaiement,
        montant: montantPaye,
        referenceId: id,
        categorie: 'paiement_client',
        observation: `Acompte pour la commande client ${numero}`
      });
    }

    return id;
  }

  /**
   * Tente de réserver les produits commandés dans le stock disponible
   */
  static async tenterReservationStock(commandeId: string): Promise<boolean> {
    const cmd = await this.getCommandeById(commandeId);
    if (!cmd) return false;

    // Seules les commandes confirmées ou en attente peuvent réserver
    if (cmd.statutCommande !== 'confirmee' && cmd.statutCommande !== 'en_attente_stock') {
      return false;
    }

    const stocks = await StockService.getStocks();
    let toutDisponible = true;

    // 1. Vérification de la disponibilité globale avant réservation
    for (const ligne of cmd.lignes) {
      const stockItem = stocks.find(s => 
        ligne.produitType === 'cage' 
          ? s.cageModeleId === ligne.cageModeleId 
          : s.accessoireId === ligne.accessoireId
      );

      const dispo = stockItem ? stockItem.quantiteDisponible : 0;
      if (dispo < ligne.quantite) {
        toutDisponible = false;
        break;
      }
    }

    if (!toutDisponible) {
      // Stock insuffisant : basculer en attente
      await db.commandes.update(commandeId, { statutCommande: 'en_attente_stock' });
      return false;
    }

    // 2. Si tout est dispo, on applique les réservations
    for (const ligne of cmd.lignes) {
      await StockService.addMouvement({
        typeProduit: ligne.produitType,
        cageModeleId: ligne.cageModeleId,
        accessoireId: ligne.accessoireId,
        typeMouvement: 'reservation',
        quantite: ligne.quantite,
        referenceId: commandeId,
        observation: `Réservation pour commande ${cmd.numero}`
      });
    }

    await db.commandes.update(commandeId, { statutCommande: 'reservee' });
    return true;
  }

  /**
   * Marquer la commande comme équipée (cages prêtes et chargées d'accessoires)
   */
  static async marquerEquipee(commandeId: string): Promise<void> {
    const cmd = await this.getCommandeById(commandeId);
    if (!cmd) throw new Error("Commande introuvable.");
    if (cmd.statutCommande !== 'reservee') {
      throw new Error("La commande doit d'abord être réservée en stock.");
    }
    await db.commandes.update(commandeId, { statutCommande: 'equipee' });
  }

  /**
   * Effectue la livraison de la commande (Sortie définitive du stock)
   */
  static async livrerCommande(
    commandeId: string,
    livreur: string,
    lieu: string
  ): Promise<void> {
    const cmd = await this.getCommandeById(commandeId);
    if (!cmd) throw new Error("Commande introuvable.");

    // Pas de livraison possible si non équipée ou non réservée (sécurité de stock)
    if (cmd.statutCommande !== 'equipee' && cmd.statutCommande !== 'reservee') {
      throw new Error("Impossible de livrer : les articles ne sont pas prêts ou réservés en stock.");
    }

    // Effectuer la sortie de stock définitive pour chaque ligne (cages et accessoires)
    for (const ligne of cmd.lignes) {
      await StockService.addMouvement({
        typeProduit: ligne.produitType,
        cageModeleId: ligne.cageModeleId,
        accessoireId: ligne.accessoireId,
        typeMouvement: 'sortie',
        quantite: ligne.quantite,
        referenceId: commandeId,
        observation: `Sortie de stock pour livraison de la commande ${cmd.numero}`
      });
    }

    // Si les frais de livraison sont supportés par SENGAGE, on enregistre une dépense
    if (cmd.fraisSupportesPar === 'sengage' && cmd.fraisLivraison > 0) {
      await FinancesService.addOperation({
        type: 'decaissement',
        compteSource: 'caisse', // Par défaut
        compteDestination: 'none',
        montant: cmd.fraisLivraison,
        referenceId: commandeId,
        categorie: 'frais_livraison',
        observation: `Frais de livraison de la commande ${cmd.numero} payés par SENGAGE`
      });
    }

    await db.commandes.update(commandeId, {
      statutCommande: 'livree',
      livreur,
      lieuLivraison: lieu
    });
  }

  /**
   * Enregistre un paiement additionnel pour une commande client
   */
  static async addPaiement(
    commandeId: string,
    montant: number,
    compte: 'caisse' | 'wave' | 'orange_money'
  ): Promise<void> {
    const cmd = await this.getCommandeById(commandeId);
    if (!cmd) throw new Error("Commande introuvable.");

    // Enregistrer l'encaissement financier
    await FinancesService.addOperation({
      type: 'encaissement',
      compteSource: 'none',
      compteDestination: compte,
      montant: montant,
      referenceId: commandeId,
      categorie: 'paiement_client',
      observation: `Paiement complémentaire pour commande ${cmd.numero}`
    });

    // Recharger la commande pour recalculer le statut de paiement
    // (Somme de tous les encaissements associés à cette commande)
    const operations = await db.operationsFinancieres
      .where('referenceId').equals(commandeId)
      .and(op => op.type === 'encaissement')
      .toArray();
    
    const totalPaye = operations.reduce((sum, op) => sum + op.montant, 0);

    // Calcul du total de la commande
    let totalArticles = cmd.lignes.reduce((sum, l) => sum + (l.quantite * l.prixVenteReel), 0);
    const totalCommande = totalArticles - cmd.remiseGlobale + cmd.fraisLivraison;

    let statutPaiement: PaiementStatut = 'partiellement_payee';
    if (totalPaye >= totalCommande) {
      statutPaiement = 'payee';
    }

    await db.commandes.update(commandeId, { statutPaiement });
  }

  /**
   * Clôture définitivement une commande
   */
  static async cloturerCommande(commandeId: string): Promise<void> {
    const cmd = await this.getCommandeById(commandeId);
    if (!cmd) throw new Error("Commande introuvable.");
    if (cmd.statutCommande !== 'livree') {
      throw new Error("Une commande doit être livrée pour être clôturée.");
    }
    await db.commandes.update(commandeId, { statutCommande: 'cloturee' });
  }
}
