import { db } from '../database/db';

export class LocalBackupService {
  private static TABLES = [
    'cagesModeles',
    'cagesCategories',
    'accessoires',
    'accessoiresCategories',
    'kits',
    'contacts',
    'commandes',
    'commandeLignes',
    'fabrications',
    'fabricationLignes',
    'achats',
    'achatLignes',
    'stocks',
    'stockMouvements',
    'operationsFinancieres'
  ] as const;

  /**
   * Exporte l'ensemble des données de la base locale Dexie dans un fichier JSON téléchargé par le navigateur.
   */
  static async exportBackup(): Promise<void> {
    const backupData: Record<string, any[]> = {};

    for (const tableName of this.TABLES) {
      const table = db[tableName] as any;
      if (table) {
        backupData[tableName] = await table.toArray();
      }
    }

    const backupPayload = {
      appName: 'SENGAGE',
      version: 3, // backup format schema version
      timestamp: new Date().toISOString(),
      data: backupData
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `sengage_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Importe un fichier de sauvegarde JSON, valide son format, vide la base de données actuelle
   * et y injecte les nouvelles données de manière transactionnelle.
   */
  static async importBackup(file: File): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          if (!text) {
            return resolve({ success: false, message: "Le fichier de sauvegarde est vide." });
          }

          const parsed = JSON.parse(text);
          if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
            return resolve({ success: false, message: "Format de fichier invalide (les données brutes sont manquantes)." });
          }

          const restoreData: Record<string, any[]> = parsed.data;

          // Exécuter l'importation de manière atomique sous forme de transaction en écriture sur toutes les tables
          await db.transaction('rw', this.TABLES.map(t => db[t] as any), async () => {
            for (const tableName of this.TABLES) {
              const table = db[tableName] as any;
              const records = restoreData[tableName];

              if (table) {
                // Même si les données d'une table sont absentes dans la sauvegarde (par exemple anciennes versions de sauvegarde),
                // on nettoie pour éviter des doublons orphelins.
                await table.clear();

                if (Array.isArray(records) && records.length > 0) {
                  // Reconvertir les chaînes ISO de dates en objets Date pour Dexie
                  const parsedRecords = records.map((record: any) => {
                    const newRecord = { ...record };
                    for (const key in newRecord) {
                      if (
                        (key.toLowerCase().includes('date') || key === 'createdAt') &&
                        typeof newRecord[key] === 'string'
                      ) {
                        newRecord[key] = new Date(newRecord[key]);
                      }
                    }
                    return newRecord;
                  });

                  await table.bulkAdd(parsedRecords);
                }
              }
            }
          });

          resolve({ success: true, message: "Données locales restaurées avec succès !" });
        } catch (err) {
          console.error("Erreur d'importation de sauvegarde :", err);
          resolve({ success: false, message: `Échec de la restauration : ${(err as Error).message}` });
        }
      };
      
      reader.onerror = () => {
        resolve({ success: false, message: "Erreur de lecture physique du fichier." });
      };

      reader.readAsText(file);
    });
  }
}
