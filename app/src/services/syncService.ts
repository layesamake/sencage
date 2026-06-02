import { db } from '../database/db';
import { supabase } from './supabase';

export class SyncService {
  /**
   * Synchronise l'ensemble des tables locales avec Supabase
   */
  static async syncAll(): Promise<{ success: boolean; message: string }> {
    if (!navigator.onLine) {
      return { success: false, message: "L'appareil est hors ligne. Synchronisation impossible." };
    }

    try {
      // Synchronisation de chaque table une par une (ordre logique : entités indépendantes d'abord)
      await this.syncTable('cagesModeles', 'cages_modeles');
      await this.syncTable('accessoires', 'accessoires');
      await this.syncTable('kits', 'kits');
      await this.syncTable('contacts', 'contacts');
      await this.syncTable('commandes', 'commandes');
      await this.syncTable('commandeLignes', 'commande_lignes');
      await this.syncTable('fabrications', 'fabrications');
      await this.syncTable('fabricationLignes', 'fabrication_lignes');
      await this.syncTable('achats', 'achats');
      await this.syncTable('achatLignes', 'achat_lignes');
      await this.syncTable('stocks', 'stocks');
      await this.syncTable('stockMouvements', 'stock_mouvements');
      await this.syncTable('operationsFinancieres', 'operations_financieres');

      return { success: true, message: "Synchronisation réussie avec le cloud." };
    } catch (error) {
      console.error("Erreur durant la synchronisation :", error);
      return { success: false, message: `Échec de synchronisation : ${(error as Error).message}` };
    }
  }

  /**
   * Synchronise une table spécifique
   */
  private static async syncTable(dexieTableKey: keyof typeof db, supabaseTableName: string): Promise<void> {
    const table = db[dexieTableKey] as any;
    if (!table) return;

    // 1. Récupérer les données locales
    const localRecords = await table.toArray();
    if (localRecords.length === 0) return;

    // 2. Envoyer (Push) les données locales vers Supabase
    // Dans une V1 mono-utilisateur simple, on fait un upsert
    // On doit convertir les objets camelCase en snake_case si la base Supabase utilise du snake_case.
    const recordsToPush = localRecords.map((rec: any) => this.toSnakeCase(rec));

    const { error: pushError } = await supabase
      .from(supabaseTableName)
      .upsert(recordsToPush, { onConflict: 'id' });

    if (pushError) {
      throw new Error(`Erreur d'envoi pour ${supabaseTableName} : ${pushError.message}`);
    }

    // 3. Récupérer (Pull) les données distantes de Supabase et les mettre dans Dexie
    // (Dans cette version simple, Supabase est mis à jour par le client. Si d'autres appareils écrivent,
    // on ferait une récupération ici.)
    const { data: remoteRecords, error: pullError } = await supabase
      .from(supabaseTableName)
      .select('*');

    if (pullError) {
      throw new Error(`Erreur de récupération pour ${supabaseTableName} : ${pullError.message}`);
    }

    if (remoteRecords && remoteRecords.length > 0) {
      const recordsToStore = remoteRecords.map((rec: any) => this.toCamelCase(rec));
      await table.bulkPut(recordsToStore);
    }
  }

  /**
   * Convertit un objet camelCase en snake_case pour Supabase
   */
  private static toSnakeCase(obj: any): any {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        newObj[snakeKey] = obj[key] instanceof Date ? obj[key].toISOString() : obj[key];
      }
    }
    return newObj;
  }

  /**
   * Convertit un objet snake_case en camelCase pour Dexie/TypeScript
   */
  private static toCamelCase(obj: any): any {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        newObj[camelKey] = (camelKey.startsWith('date') || camelKey === 'createdAt') && typeof obj[key] === 'string'
          ? new Date(obj[key])
          : obj[key];
      }
    }
    return newObj;
  }
}
