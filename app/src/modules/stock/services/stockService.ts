import { db } from '../../../database/db';
import type { StockState, StockMouvement, MouvementType } from '../../../types';

export class StockService {
  /**
   * Récupère l'état actuel de tous les stocks (Cages et Accessoires)
   */
  static async getStocks(): Promise<StockState[]> {
    return db.stocks.toArray();
  }

  /**
   * Enregistre un mouvement de stock et met à jour les quantités consolidées.
   * C'est le cœur de la logique d'inventaire offline-first.
   */
  static async addMouvement(mouvement: Omit<StockMouvement, 'id' | 'dateMouvement'>): Promise<string> {
    const id = crypto.randomUUID();
    const newMouvement: StockMouvement = {
      ...mouvement,
      id,
      dateMouvement: new Date()
    };

    // 1. Enregistrer le mouvement dans le journal
    await db.stockMouvements.add(newMouvement);

    // 2. Trouver ou créer l'état de stock associé
    const foundStock = await db.stocks
      .where('typeProduit').equals(mouvement.typeProduit)
      .and(s => mouvement.typeProduit === 'cage' 
        ? s.cageModeleId === mouvement.cageModeleId 
        : s.accessoireId === mouvement.accessoireId
      )
      .first();

    let stock: StockState;
    if (foundStock) {
      stock = foundStock;
    } else {
      stock = {
        id: crypto.randomUUID(),
        typeProduit: mouvement.typeProduit,
        cageModeleId: mouvement.cageModeleId,
        accessoireId: mouvement.accessoireId,
        quantiteDisponible: 0,
        quantiteReservee: 0,
        quantiteEnFabrication: 0,
        quantiteSortie: 0
      };
      await db.stocks.add(stock);
    }

    // 3. Mettre à jour les quantités consolidées en fonction du type de mouvement
    const qty = mouvement.quantite;

    switch (mouvement.typeMouvement) {
      case 'entree':
        stock.quantiteDisponible += qty;
        break;
      case 'sortie':
        // Une sortie peut provenir d'une réservation (ex: livraison de commande)
        // ou d'un déstockage direct.
        if (stock.quantiteReservee >= qty) {
          stock.quantiteReservee -= qty;
        } else {
          stock.quantiteDisponible = Math.max(0, stock.quantiteDisponible - qty);
        }
        stock.quantiteSortie += qty;
        break;
      case 'reservation':
        // Réservation d'articles (commande confirmée mais non livrée)
        // Déplace la quantité disponible vers réservée
        const qtyToReserve = Math.min(qty, stock.quantiteDisponible);
        stock.quantiteDisponible -= qtyToReserve;
        stock.quantiteReservee += qtyToReserve;
        break;
      case 'correction':
        // Correction manuelle (inventaire physique)
        stock.quantiteDisponible = qty;
        break;
    }

    await db.stocks.update(stock.id, stock);
    return id;
  }

  /**
   * Récupère l'historique des mouvements pour un produit spécifique
   */
  static async getMouvementsByProduct(
    typeProduit: 'cage' | 'accessoire',
    productId: string
  ): Promise<StockMouvement[]> {
    return db.stockMouvements
      .where('typeProduit').equals(typeProduit)
      .and(m => typeProduit === 'cage' ? m.cageModeleId === productId : m.accessoireId === productId)
      .reverse()
      .sortBy('dateMouvement');
  }

  /**
   * Met à jour la quantité "en fabrication" dans l'état de stock (calculée à la commande interne)
   */
  static async updateQuantiteEnFabrication(cageModeleId: string, delta: number): Promise<void> {
    const foundStock = await db.stocks
      .where('typeProduit').equals('cage')
      .and(s => s.cageModeleId === cageModeleId)
      .first();

    let stock: StockState;
    if (foundStock) {
      stock = foundStock;
    } else {
      stock = {
        id: crypto.randomUUID(),
        typeProduit: 'cage',
        cageModeleId,
        quantiteDisponible: 0,
        quantiteReservee: 0,
        quantiteEnFabrication: 0,
        quantiteSortie: 0
      };
      await db.stocks.add(stock);
    }

    stock.quantiteEnFabrication = Math.max(0, stock.quantiteEnFabrication + delta);
    await db.stocks.update(stock.id, stock);
  }
}
