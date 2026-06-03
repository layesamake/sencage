import { db } from '../../../database/db';
import type { CageModele, CageCategorie, Accessoire, AccessoireCategorie, Kit } from '../../../types';

export class ProduitsService {
  // === Catégories de Cages ===

  static async getCagesCategories(): Promise<CageCategorie[]> {
    let list = await db.cagesCategories.toArray();
    if (list.length === 0) {
      const defaults = ["Cage Caille", "Cage Poulet", "Cage Lapin"];
      
      const models = await db.cagesModeles.toArray();
      const existingEspeces = Array.from(new Set(models.map(m => m.espece).filter(Boolean)));
      
      const mapEspece = (e: string) => {
        const val = e.toLowerCase();
        if (val === 'caille') return 'Cage Caille';
        if (val === 'poulet') return 'Cage Poulet';
        if (val === 'lapin') return 'Cage Lapin';
        return e;
      };

      const mappedEspeces = existingEspeces.map(mapEspece);
      const allCatsToSeed = Array.from(new Set([...defaults, ...mappedEspeces]));
      
      for (const nom of allCatsToSeed) {
        await db.cagesCategories.add({
          id: crypto.randomUUID(),
          nom: nom.trim(),
          createdAt: new Date()
        });
      }

      // Migrer les cages existantes
      for (const model of models) {
        const prettyName = mapEspece(model.espece);
        if (prettyName !== model.espece) {
          await db.cagesModeles.update(model.id, { espece: prettyName });
        }
      }

      list = await db.cagesCategories.toArray();
    }
    return list.sort((a, b) => a.nom.localeCompare(b.nom));
  }

  static async addCageCategorie(nom: string): Promise<string> {
    const cleanNom = nom.trim();
    if (!cleanNom) throw new Error("Le nom de la catégorie ne peut pas être vide.");
    
    const existing = await db.cagesCategories.where('nom').equalsIgnoreCase(cleanNom).first();
    if (existing) throw new Error("Cette catégorie existe déjà.");

    const id = crypto.randomUUID();
    await db.cagesCategories.add({
      id,
      nom: cleanNom,
      createdAt: new Date()
    });
    return id;
  }

  static async updateCageCategorie(id: string, nouveauNom: string): Promise<void> {
    const cleanNom = nouveauNom.trim();
    if (!cleanNom) throw new Error("Le nom de la catégorie ne peut pas être vide.");

    const category = await db.cagesCategories.get(id);
    if (!category) throw new Error("Catégorie introuvable.");

    const existing = await db.cagesCategories.where('nom').equalsIgnoreCase(cleanNom).first();
    if (existing && existing.id !== id) throw new Error("Une autre catégorie porte déjà ce nom.");

    const ancienNom = category.nom;
    await db.cagesCategories.update(id, { nom: cleanNom });

    // Mettre à jour tous les modèles associés
    const models = await db.cagesModeles.where('espece').equals(ancienNom).toArray();
    for (const m of models) {
      await db.cagesModeles.update(m.id, { espece: cleanNom });
    }
  }

  static async deleteCageCategorie(id: string): Promise<void> {
    const category = await db.cagesCategories.get(id);
    if (!category) throw new Error("Catégorie introuvable.");

    const nomCat = category.nom;
    await db.cagesCategories.delete(id);

    const models = await db.cagesModeles.where('espece').equals(nomCat).toArray();
    
    let diversCat = await db.cagesCategories.where('nom').equalsIgnoreCase('Divers').first();
    if (!diversCat && nomCat.toLowerCase() !== 'divers') {
      await db.cagesCategories.add({
        id: crypto.randomUUID(),
        nom: 'Divers',
        createdAt: new Date()
      });
    }

    for (const m of models) {
      await db.cagesModeles.update(m.id, { espece: 'Divers' });
    }
  }

  // === Catégories d'Accessoires ===

  static async getAccessoiresCategories(): Promise<AccessoireCategorie[]> {
    let list = await db.accessoiresCategories.toArray();
    if (list.length === 0) {
      const defaults = ["Abreuvoirs", "Mangeoires", "Tuyauterie", "Grillage", "Divers"];
      
      const accessories = await db.accessoires.toArray();
      const existingCats = Array.from(new Set(accessories.map(a => a.categorie).filter(Boolean)));
      
      const allCatsToSeed = Array.from(new Set([...defaults, ...existingCats]));
      
      for (const nom of allCatsToSeed) {
        await db.accessoiresCategories.add({
          id: crypto.randomUUID(),
          nom: nom.trim(),
          createdAt: new Date()
        });
      }
      list = await db.accessoiresCategories.toArray();
    }
    return list.sort((a, b) => a.nom.localeCompare(b.nom));
  }

  static async addAccessoireCategorie(nom: string): Promise<string> {
    const cleanNom = nom.trim();
    if (!cleanNom) throw new Error("Le nom de la catégorie ne peut pas être vide.");
    
    // Vérifier l'unicité
    const existing = await db.accessoiresCategories.where('nom').equalsIgnoreCase(cleanNom).first();
    if (existing) throw new Error("Cette catégorie existe déjà.");

    const id = crypto.randomUUID();
    await db.accessoiresCategories.add({
      id,
      nom: cleanNom,
      createdAt: new Date()
    });
    return id;
  }

  static async updateAccessoireCategorie(id: string, nouveauNom: string): Promise<void> {
    const cleanNom = nouveauNom.trim();
    if (!cleanNom) throw new Error("Le nom de la catégorie ne peut pas être vide.");

    const category = await db.accessoiresCategories.get(id);
    if (!category) throw new Error("Catégorie introuvable.");

    // Vérifier l'unicité (sauf pour la catégorie elle-même)
    const existing = await db.accessoiresCategories.where('nom').equalsIgnoreCase(cleanNom).first();
    if (existing && existing.id !== id) throw new Error("Une autre catégorie porte déjà ce nom.");

    const ancienNom = category.nom;
    await db.accessoiresCategories.update(id, { nom: cleanNom });

    // Mettre à jour tous les accessoires qui utilisaient l'ancien nom de catégorie
    const accessories = await db.accessoires.where('categorie').equals(ancienNom).toArray();
    for (const acc of accessories) {
      await db.accessoires.update(acc.id, { categorie: cleanNom });
    }
  }

  static async deleteAccessoireCategorie(id: string): Promise<void> {
    const category = await db.accessoiresCategories.get(id);
    if (!category) throw new Error("Catégorie introuvable.");

    const nomCat = category.nom;
    await db.accessoiresCategories.delete(id);

    // Mettre à jour tous les accessoires qui utilisaient cette catégorie vers "Divers"
    const accessories = await db.accessoires.where('categorie').equals(nomCat).toArray();
    
    // S'assurer que la catégorie "Divers" existe localement
    let diversCat = await db.accessoiresCategories.where('nom').equalsIgnoreCase('Divers').first();
    if (!diversCat && nomCat.toLowerCase() !== 'divers') {
      await db.accessoiresCategories.add({
        id: crypto.randomUUID(),
        nom: 'Divers',
        createdAt: new Date()
      });
    }

    for (const acc of accessories) {
      await db.accessoires.update(acc.id, { categorie: 'Divers' });
    }
  }

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
