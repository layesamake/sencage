import { db } from '../../../database/db';
import type { CageModele, Accessoire, Kit } from '../../../types';

export class ProduitsService {
  // === Modèles de Cages ===
  
  static async getCagesModeles(): Promise<CageModele[]> {
    return db.cagesModeles.toArray();
  }

  static async addCageModele(cage: Omit<CageModele, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newCage: CageModele = {
      ...cage,
      id,
      createdAt: new Date()
    };
    await db.cagesModeles.add(newCage);
    return id;
  }

  static async updateCageModele(id: string, data: Partial<Omit<CageModele, 'id' | 'createdAt'>>): Promise<void> {
    await db.cagesModeles.update(id, data);
  }

  // === Accessoires ===

  static async getAccessoires(): Promise<Accessoire[]> {
    return db.accessoires.toArray();
  }

  static async addAccessoire(accessoire: Omit<Accessoire, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newAccessoire: Accessoire = {
      ...accessoire,
      id,
      createdAt: new Date()
    };
    await db.accessoires.add(newAccessoire);
    
    // Initialiser automatiquement l'état de stock pour cet accessoire
    await db.stocks.add({
      id: crypto.randomUUID(),
      typeProduit: 'accessoire',
      accessoireId: id,
      quantiteDisponible: 0,
      quantiteReservee: 0,
      quantiteEnFabrication: 0,
      quantiteSortie: 0
    });

    return id;
  }

  static async updateAccessoire(id: string, data: Partial<Omit<Accessoire, 'id' | 'createdAt'>>): Promise<void> {
    await db.accessoires.update(id, data);
  }

  // === Kits ===

  static async getKits(): Promise<Kit[]> {
    return db.kits.toArray();
  }

  static async addKit(kit: Omit<Kit, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newKit: Kit = {
      ...kit,
      id,
      createdAt: new Date()
    };
    await db.kits.add(newKit);
    return id;
  }

  static async deleteKit(id: string): Promise<void> {
    await db.kits.delete(id);
  }
}
