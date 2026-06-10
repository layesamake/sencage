import { db } from '../../../database/db';
import type { Contact } from '../../../types';

export class ContactsService {
  static async getContacts(): Promise<Contact[]> {
    return db.contacts.toArray();
  }

  static async getContactsByType(type: 'client' | 'menuisier' | 'fournisseur'): Promise<Contact[]> {
    return db.contacts.where('type').equals(type).toArray();
  }

  static async addContact(contact: Omit<Contact, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newContact: Contact = {
      ...contact,
      id,
      createdAt: new Date()
    };
    await db.contacts.add(newContact);
    return id;
  }

  static async updateContact(id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>): Promise<void> {
    await db.contacts.update(id, data);
  }

  // === Statistiques spécifiques par contact ===

  /**
   * Retourne les statistiques d'achat et reliquats pour un client
   */
  static async getClientStats(clientId: string): Promise<{
    commandesCount: number;
    totalAchete: number;
    totalPaye: number;
    reliquatDu: number;
  }> {
    const commandes = await db.commandes.where('clientId').equals(clientId).toArray();
    let totalAchete = 0;
    let totalPaye = 0;

    for (const cmd of commandes) {
      // Charger les lignes pour avoir le total de chaque commande
      const lignes = await db.commandeLignes.where('commandeId').equals(cmd.id).toArray();
      const totalArticles = lignes.reduce((sum, l) => sum + (l.quantite * l.prixVenteReel), 0);
      const totalCommande = totalArticles - cmd.remiseGlobale + cmd.fraisLivraison;
      
      totalAchete += totalCommande;

      // Charger les paiements financiers effectués
      const ops = await db.operationsFinancieres
        .where('referenceId').equals(cmd.id)
        .and(op => op.type === 'encaissement')
        .toArray();
      totalPaye += ops.reduce((sum, op) => sum + op.montant, 0);
    }

    return {
      commandesCount: commandes.length,
      totalAchete,
      totalPaye,
      reliquatDu: Math.max(0, totalAchete - totalPaye)
    };
  }

  /**
   * Retourne les statistiques de commandes et reliquats pour un menuisier
   */
  static async getMenuisierStats(menuisierId: string): Promise<{
    fabricationsEnCours: number;
    totalCommandes: number;
    avancesRecues: number;
    reliquatDu: number;
  }> {
    const fabrications = await db.fabrications.where('menuisierId').equals(menuisierId).toArray();
    let fabricationsEnCours = 0;
    let totalCommandes = 0;
    let avancesRecues = 0;

    for (const fab of fabrications) {
      if (fab.statut === 'commandee' || fab.statut === 'en_fabrication' || fab.statut === 'terminee') {
        fabricationsEnCours++;
      }

      const lignes = await db.fabricationLignes.where('fabricationId').equals(fab.id).toArray();
      const totalCost = lignes.reduce((sum, l) => sum + (l.quantite * l.coutUnitaireNegocie), 0) - fab.remise;
      totalCommandes += totalCost;
      avancesRecues += fab.avancePayee;
    }

    return {
      fabricationsEnCours,
      totalCommandes,
      avancesRecues,
      reliquatDu: Math.max(0, totalCommandes - avancesRecues)
    };
  }

  /**
   * Retourne les statistiques d'achats pour un fournisseur
   */
  static async getFournisseurStats(fournisseurId: string): Promise<{
    achatsCount: number;
    totalDepense: number;
  }> {
    const achats = await db.achats.where('fournisseurId').equals(fournisseurId).toArray();
    const totalDepense = achats.reduce((sum, a) => sum + a.montantTotal, 0);

    return {
      achatsCount: achats.length,
      totalDepense
    };
  }
}
