import { db } from '../../../database/db';
import type { Commande, CommandeLigne } from '../../../types';

export class RapportsService {
  /**
   * Récupère le dernier coût de fabrication réel pour un modèle de cage.
   * Règle : dernier coût réel enregistré. Si aucun, coût de fabrication de référence.
   */
  static async getDernierCoutCage(cageModeleId: string): Promise<number> {
    const lastLigne = await db.fabricationLignes
      .where('cageModeleId').equals(cageModeleId)
      .reverse()
      .first();

    if (lastLigne) {
      return lastLigne.coutUnitaireNegocie;
    }

    const model = await db.cagesModeles.get(cageModeleId);
    return model ? model.coutFabricationRef : 0;
  }

  /**
   * Récupère le dernier coût d'achat réel pour un accessoire.
   * Règle : dernier coût réel enregistré. Si aucun, prix d'achat de base.
   */
  static async getDernierCoutAccessoire(accessoireId: string): Promise<number> {
    const lastLigne = await db.achatLignes
      .where('accessoireId').equals(accessoireId)
      .reverse()
      .first();

    if (lastLigne) {
      return lastLigne.prixUnitaireAchat;
    }

    const acc = await db.accessoires.get(accessoireId);
    return acc ? acc.prixAchat : 0;
  }

  /**
   * Calcule la marge d'une commande client.
   * Formule :
   *   Marge = Total Ventes (réelles) - Remise globale - Frais de livraison (si SENGAGE) - Coût de revient (Cages + Accessoires)
   */
  static async calculateMargeCommande(commandeId: string): Promise<number> {
    const cmd = await db.commandes.get(commandeId);
    if (!cmd) return 0;

    const lignes = await db.commandeLignes.where('commandeId').equals(commandeId).toArray();
    let totalVenteReel = 0;
    let totalCoutRevient = 0;

    for (const l of lignes) {
      totalVenteReel += l.quantite * l.prixVenteReel;

      if (l.produitType === 'cage' && l.cageModeleId) {
        // Coût réel de la cage
        const coutCage = await this.getDernierCoutCage(l.cageModeleId);
        totalCoutRevient += l.quantite * coutCage;
      } else if (l.produitType === 'accessoire' && l.accessoireId) {
        // Coût réel de l'accessoire
        const coutAcc = await this.getDernierCoutAccessoire(l.accessoireId);
        totalCoutRevient += l.quantite * coutAcc;
      }
    }

    // Retirer la remise globale du client
    let totalRevenu = totalVenteReel - cmd.remiseGlobale;

    // Si les frais de livraison sont supportés par SENGAGE, cela diminue notre marge
    const fraisLivraisonPayesParSengage = cmd.fraisSupportesPar === 'sengage' ? cmd.fraisLivraison : 0;

    // Marge = Revenu réel - Coûts des articles - Frais de livraison à notre charge
    return totalRevenu - totalCoutRevient - fraisLivraisonPayesParSengage;
  }

  /**
   * Calcule la marge mensuelle consolidée pour un mois et une année donnés
   */
  static async calculateMargeMensuelle(mois: number, annee: number): Promise<{
    ventes: number;
    marge: number;
    depensesDiverses: number;
  }> {
    // 1. Récupérer toutes les commandes livrées ou clôturées du mois
    const debutMois = new Date(annee, mois, 1);
    const finMois = new Date(annee, mois + 1, 0, 23, 59, 59);

    const commandesDuMois = await db.commandes
      .where('dateCommande')
      .between(debutMois, finMois)
      .and(cmd => cmd.statutCommande === 'livree' || cmd.statutCommande === 'cloturee')
      .toArray();

    let totalVentes = 0;
    let totalMarge = 0;

    for (const cmd of commandesDuMois) {
      const totalArticles = await db.commandeLignes
        .where('commandeId').equals(cmd.id)
        .toArray()
        .then(lignes => lignes.reduce((sum, l) => sum + (l.quantite * l.prixVenteReel), 0));
      
      totalVentes += totalArticles - cmd.remiseGlobale;

      const margeCmd = await this.calculateMargeCommande(cmd.id);
      totalMarge += margeCmd;
    }

    // 2. Récupérer les dépenses diverses non comptées dans la livraison (ex: transport récupération cages)
    const operations = await db.operationsFinancieres
      .where('dateOperation')
      .between(debutMois, finMois)
      .and(op => op.type === 'decaissement')
      .toArray();

    // Dépenses de transport ou diverses qui réduisent la rentabilité globale du mois
    const depensesDiverses = operations
      .filter(op => op.categorie === 'transport_recuperation' || op.categorie === 'depense_diverse')
      .reduce((sum, op) => sum + op.montant, 0);

    return {
      ventes: totalVentes,
      marge: totalMarge - depensesDiverses,
      depensesDiverses
    };
  }

  /**
   * Liste des clients débiteurs
   */
  static async getClientsDebiteurs(): Promise<{
    clientNom: string;
    clientTel: string;
    reliquatTotal: number;
  }[]> {
    const clients = await db.contacts.where('type').equals('client').toArray();
    const listeDebiteurs = [];

    for (const c of clients) {
      const commandes = await db.commandes.where('clientId').equals(c.id).toArray();
      let totalDu = 0;
      let totalPaye = 0;

      for (const cmd of commandes) {
        const lignes = await db.commandeLignes.where('commandeId').equals(cmd.id).toArray();
        const totalArticles = lignes.reduce((sum, l) => sum + (l.quantite * l.prixVenteReel), 0);
        const totalCommande = totalArticles - cmd.remiseGlobale + cmd.fraisLivraison;
        
        totalDu += totalCommande;

        // Charger les paiements effectués
        const ops = await db.operationsFinancieres
          .where('referenceId').equals(cmd.id)
          .and(op => op.type === 'encaissement')
          .toArray();
        
        totalPaye += ops.reduce((sum, op) => sum + op.montant, 0);
      }

      const reliquat = totalDu - totalPaye;
      if (reliquat > 0) {
        listeDebiteurs.push({
          clientNom: c.nom,
          clientTel: c.telephone,
          reliquatTotal: reliquat
        });
      }
    }

    return listeDebiteurs;
  }
}
