import { db } from '../../../database/db';
import type { Fabrication, FabricationLigne, FabricationStatut } from '../../../types';
import { StockService } from '../../stock/services/stockService';
import { FinancesService } from '../../finances/services/financesService';

export class FabricationsService {
  static async getFabrications(): Promise<Fabrication[]> {
    const list = await db.fabrications.toArray();
    // Charger les lignes pour chaque fabrication
    for (const fab of list) {
      fab.lignes = await db.fabricationLignes.where('fabricationId').equals(fab.id).toArray();
    }
    return list;
  }

  static async getFabricationById(id: string): Promise<Fabrication | undefined> {
    const fab = await db.fabrications.get(id);
    if (fab) {
      fab.lignes = await db.fabricationLignes.where('fabricationId').equals(fab.id).toArray();
    }
    return fab;
  }

  /**
   * Crée une commande de fabrication interne
   */
  static async createFabrication(
    fabData: Omit<Fabrication, 'id' | 'numero' | 'statut' | 'createdAt' | 'lignes'>,
    lignes: Omit<FabricationLigne, 'id' | 'fabricationId'>[],
    comptePaiement?: 'caisse' | 'wave' | 'orange_money'
  ): Promise<string> {
    const id = crypto.randomUUID();
    
    // Génération du numéro FAB-YYMMDD-XXX
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const count = await db.fabrications.count();
    const numero = `FAB-${dateStr}-${String(count + 1).padStart(3, '0')}`;

    const newFab: Fabrication = {
      ...fabData,
      id,
      numero,
      statut: 'commandee',
      createdAt: now,
      lignes: []
    };

    // 1. Ajouter la fabrication dans la DB
    await db.fabrications.add(newFab);

    // 2. Ajouter les lignes et mettre à jour le stock "en fabrication"
    for (const ligne of lignes) {
      const lineId = crypto.randomUUID();
      await db.fabricationLignes.add({
        ...ligne,
        id: lineId,
        fabricationId: id
      });

      // Mettre à jour les stocks virtuels "en fabrication"
      await StockService.updateQuantiteEnFabrication(ligne.cageModeleId, ligne.quantite);
    }

    // 3. Enregistrer l'avance de paiement s'il y en a une
    if (fabData.avancePayee > 0 && comptePaiement) {
      await FinancesService.addOperation({
        type: 'decaissement',
        compteSource: comptePaiement,
        compteDestination: 'none',
        montant: fabData.avancePayee,
        referenceId: id,
        categorie: 'paiement_menuisier',
        observation: `Avance pour la commande de fabrication ${numero}`
      });
    }

    return id;
  }

  /**
   * Change le statut de fabrication
   */
  static async updateStatut(id: string, statut: FabricationStatut): Promise<void> {
    const fab = await this.getFabricationById(id);
    if (!fab) throw new Error("Commande de fabrication introuvable.");

    // Logique lors de la réception effective en stock
    if (statut === 'recue_en_stock' && fab.statut !== 'recue_en_stock') {
      // 1. Décrémenter la quantité "en fabrication" et entrer en stock disponible
      for (const ligne of fab.lignes) {
        await StockService.updateQuantiteEnFabrication(ligne.cageModeleId, -ligne.quantite);
        
        await StockService.addMouvement({
          typeProduit: 'cage',
          cageModeleId: ligne.cageModeleId,
          typeMouvement: 'entree',
          quantite: ligne.quantite,
          referenceId: id,
          observation: `Entrée en stock suite à fabrication ${fab.numero}`
        });
      }
    }

    await db.fabrications.update(id, { statut });
  }

  /**
   * Enregistre un paiement supplémentaire (reliquat ou acompte additionnel)
   */
  static async addPaiement(
    id: string,
    montant: number,
    compte: 'caisse' | 'wave' | 'orange_money'
  ): Promise<void> {
    const fab = await this.getFabricationById(id);
    if (!fab) throw new Error("Commande de fabrication introuvable.");

    const nouveauMontantAvance = fab.avancePayee + montant;
    
    // Enregistrer le décaissement financier
    await FinancesService.addOperation({
      type: 'decaissement',
      compteSource: compte,
      compteDestination: 'none',
      montant: montant,
      referenceId: id,
      categorie: 'paiement_menuisier',
      observation: `Paiement pour fabrication ${fab.numero}`
    });

    const coutTotal = fab.lignes.reduce((sum, l) => sum + (l.quantite * l.coutUnitaireNegocie), 0) - fab.remise;
    const estTotalementPaye = nouveauMontantAvance >= coutTotal;

    await db.fabrications.update(id, {
      avancePayee: nouveauMontantAvance,
      statut: estTotalementPaye ? 'payee' : fab.statut
    });
  }
}
