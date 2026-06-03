export type EspeceType = string;
export type UniteType = 'piece' | 'metre' | 'rouleau' | 'lot';
export type ContactType = 'client' | 'menuisier' | 'fournisseur';
export type CompteType = 'caisse' | 'wave' | 'orange_money';
export type FraisSupportesPar = 'client' | 'sengage';

export type CommandeStatut = 'brouillon' | 'confirmee' | 'en_attente_stock' | 'reservee' | 'equipee' | 'livree' | 'cloturee';
export type PaiementStatut = 'non_payee' | 'partiellement_payee' | 'payee';

export type FabricationStatut = 'commandee' | 'en_fabrication' | 'terminee' | 'recue_en_stock' | 'payee';

export type MouvementType = 'entree' | 'sortie' | 'reservation' | 'correction';
export type OperationFinanciereType = 'encaissement' | 'decaissement' | 'transfert_interne';

export interface CageModele {
  id: string;
  nom: string;
  espece: EspeceType;
  prixVenteBase: number;
  coutFabricationRef: number;
  actif: boolean;
  createdAt: Date;
}

export interface CageCategorie {
  id: string;
  nom: string;
  createdAt: Date;
}

export interface Accessoire {
  id: string;
  nom: string;
  categorie: string;
  unite: UniteType;
  prixAchat: number;
  prixVente: number;
  seuilStockFaible: number;
  createdAt: Date;
}

export interface AccessoireCategorie {
  id: string;
  nom: string;
  createdAt: Date;
}

export interface Kit {
  id: string;
  nom: string;
  cageModeleId: string;
  accessoires: {
    accessoireId: string;
    quantite: number;
  }[];
  createdAt: Date;
}

export interface Contact {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  type: ContactType;
  observation?: string;
  createdAt: Date;
}

export interface CommandeLigne {
  id: string;
  commandeId: string;
  produitType: 'cage' | 'accessoire';
  cageModeleId?: string;
  accessoireId?: string;
  quantite: number;
  prixVenteReel: number;
  coutReference: number;
}

export interface Commande {
  id: string;
  numero: string;
  clientId: string;
  dateCommande: Date;
  statutCommande: CommandeStatut;
  statutPaiement: PaiementStatut;
  remiseGlobale: number;
  fraisLivraison: number;
  fraisSupportesPar: FraisSupportesPar;
  lieuLivraison?: string;
  livreur?: string;
  observation?: string;
  lignes: CommandeLigne[];
  createdAt: Date;
}

export interface FabricationLigne {
  id: string;
  fabricationId: string;
  cageModeleId: string;
  quantite: number;
  coutUnitaireNegocie: number;
}

export interface Fabrication {
  id: string;
  numero: string;
  menuisierId: string;
  dateCommande: Date;
  datePrevue: Date;
  statut: FabricationStatut;
  avancePayee: number;
  remise: number;
  observation?: string;
  lignes: FabricationLigne[];
  createdAt: Date;
}

export interface AchatLigne {
  id: string;
  achatId: string;
  accessoireId: string;
  quantite: number;
  prixUnitaireAchat: number;
}

export interface Achat {
  id: string;
  fournisseurId: string;
  dateAchat: Date;
  comptePaiement: CompteType;
  montantTotal: number;
  observation?: string;
  lignes: AchatLigne[];
  createdAt: Date;
}

export interface StockState {
  id: string;
  typeProduit: 'cage' | 'accessoire';
  cageModeleId?: string;
  accessoireId?: string;
  quantiteDisponible: number;
  quantiteReservee: number;
  quantiteEnFabrication: number;
  quantiteSortie: number;
}

export interface StockMouvement {
  id: string;
  typeProduit: 'cage' | 'accessoire';
  cageModeleId?: string;
  accessoireId?: string;
  typeMouvement: MouvementType;
  quantite: number;
  referenceId?: string;
  dateMouvement: Date;
  observation?: string;
}

export interface OperationFinanciere {
  id: string;
  type: OperationFinanciereType;
  compteSource: CompteType | 'none';
  compteDestination: CompteType | 'none';
  montant: number;
  dateOperation: Date;
  referenceId?: string;
  categorie: string;
  observation?: string;
}
