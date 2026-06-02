import { db } from '../../../database/db';
import type { OperationFinanciere, CompteType } from '../../../types';

export class FinancesService {
  static async getOperations(): Promise<OperationFinanciere[]> {
    return db.operationsFinancieres.reverse().sortBy('dateOperation');
  }

  /**
   * Enregistre une opération financière (encaissement, décaissement, transfert)
   */
  static async addOperation(op: Omit<OperationFinanciere, 'id' | 'dateOperation'>): Promise<string> {
    const id = crypto.randomUUID();
    const newOp: OperationFinanciere = {
      ...op,
      id,
      dateOperation: new Date()
    };
    await db.operationsFinancieres.add(newOp);
    return id;
  }

  /**
   * Calcule le solde en temps réel d'un compte (Caisse, Wave, Orange Money)
   * Formule : Somme des entrées sur ce compte - Somme des sorties de ce compte
   */
  static async getSolde(compte: CompteType): Promise<number> {
    const operations = await db.operationsFinancieres.toArray();
    let solde = 0;

    for (const op of operations) {
      // 1. Entrées d'argent sur le compte
      if (op.compteDestination === compte) {
        solde += op.montant;
      }
      // 2. Sorties d'argent du compte
      if (op.compteSource === compte) {
        solde -= op.montant;
      }
    }

    return solde;
  }

  /**
   * Retourne les soldes de tous les comptes ainsi que le total disponible
   */
  static async getSoldesSynthese(): Promise<{
    caisse: number;
    wave: number;
    orangeMoney: number;
    total: number;
  }> {
    const caisse = await this.getSolde('caisse');
    const wave = await this.getSolde('wave');
    const orangeMoney = await this.getSolde('orange_money');

    return {
      caisse,
      wave,
      orangeMoney,
      total: caisse + wave + orangeMoney
    };
  }

  /**
   * Effectue un transfert de fonds interne
   * Règle : Les transferts internes ne sont jamais des ventes ni des dépenses.
   */
  static async transferer(
    source: CompteType,
    destination: CompteType,
    montant: number,
    observation?: string
  ): Promise<string> {
    if (source === destination) {
      throw new Error("Les comptes source et destination doivent être différents.");
    }

    const soldeSource = await this.getSolde(source);
    if (soldeSource < montant) {
      throw new Error(`Solde insuffisant sur le compte source (${source}).`);
    }

    return this.addOperation({
      type: 'transfert_interne',
      compteSource: source,
      compteDestination: destination,
      montant: montant,
      categorie: 'transfert',
      observation: observation || `Transfert de ${source} vers ${destination}`
    });
  }
}
