import { db } from '../../../database/db';
import type { Achat, AchatLigne } from '../../../types';
import { StockService } from '../../stock/services/stockService';
import { FinancesService } from '../../finances/services/financesService';

export class AchatsService {
  static async getAchats(): Promise<Achat[]> {
    const list = await db.achats.toArray();
    for (const a of list) {
      a.lignes = await db.achatLignes.where('achatId').equals(a.id).toArray();
    }
    return list;
  }

  /**
   * Enregistre un achat d'accessoires chez un fournisseur.
   * Règle : Paiement immédiat, pas de crédit fournisseur.
   * Conséquences :
   *   - Augmente le stock de chaque accessoire (mouvement entrée).
   *   - Débite le compte de paiement choisi (décaissement).
   */
  static async createAchat(
    achatData: Omit<Achat, 'id' | 'createdAt' | 'lignes'>,
    lignes: Omit<AchatLigne, 'id' | 'achatId'>[]
  ): Promise<string> {
    // 1. Vérifier si le compte choisi a un solde suffisant
    const soldeCompte = await FinancesService.getSolde(achatData.comptePaiement);
    if (soldeCompte < achatData.montantTotal) {
      throw new Error(`Solde suffisant indisponible sur le compte ${achatData.comptePaiement}.`);
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const newAchat: Achat = {
      ...achatData,
      id,
      createdAt: now,
      lignes: []
    };

    // 2. Enregistrer l'achat principal
    await db.achats.add(newAchat);

    // 3. Enregistrer les lignes d'achat et augmenter le stock
    for (const l of lignes) {
      await db.achatLignes.add({
        ...l,
        id: crypto.randomUUID(),
        achatId: id
      });

      // Entrée automatique des accessoires achetés dans le stock
      await StockService.addMouvement({
        typeProduit: 'accessoire',
        accessoireId: l.accessoireId,
        typeMouvement: 'entree',
        quantite: l.quantite,
        referenceId: id,
        observation: `Entrée en stock suite à achat chez fournisseur`
      });
    }

    // 4. Enregistrer la transaction financière de sortie (décaissement)
    await FinancesService.addOperation({
      type: 'decaissement',
      compteSource: achatData.comptePaiement,
      compteDestination: 'none',
      montant: achatData.montantTotal,
      referenceId: id,
      categorie: 'achat_fournisseur',
      observation: `Règlement au comptant de l'achat fournisseur`
    });

    return id;
  }
}
