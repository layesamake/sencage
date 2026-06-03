import Dexie, { type Table } from 'dexie';
import type {
  CageModele,
  CageCategorie,
  Accessoire,
  AccessoireCategorie,
  Kit,
  Contact,
  Commande,
  CommandeLigne,
  Fabrication,
  FabricationLigne,
  Achat,
  AchatLigne,
  StockState,
  StockMouvement,
  OperationFinanciere
} from '../types';

export class SengageDatabase extends Dexie {
  cagesModeles!: Table<CageModele, string>;
  cagesCategories!: Table<CageCategorie, string>;
  accessoires!: Table<Accessoire, string>;
  accessoiresCategories!: Table<AccessoireCategorie, string>;
  kits!: Table<Kit, string>;
  contacts!: Table<Contact, string>;
  commandes!: Table<Commande, string>;
  commandeLignes!: Table<CommandeLigne, string>;
  fabrications!: Table<Fabrication, string>;
  fabricationLignes!: Table<FabricationLigne, string>;
  achats!: Table<Achat, string>;
  achatLignes!: Table<AchatLigne, string>;
  stocks!: Table<StockState, string>;
  stockMouvements!: Table<StockMouvement, string>;
  operationsFinancieres!: Table<OperationFinanciere, string>;

  constructor() {
    super('SengageDatabase');
    this.version(1).stores({
      cagesModeles: 'id, nom, espece, actif',
      accessoires: 'id, nom, categorie',
      kits: 'id, nom, cageModeleId',
      contacts: 'id, nom, type',
      commandes: 'id, numero, clientId, dateCommande, statutCommande, statutPaiement',
      commandeLignes: 'id, commandeId, cageModeleId, accessoireId',
      fabrications: 'id, numero, menuisierId, dateCommande, statut',
      fabricationLignes: 'id, fabricationId, cageModeleId',
      achats: 'id, fournisseurId, dateAchat',
      achatLignes: 'id, achatId, accessoireId',
      stocks: 'id, typeProduit, cageModeleId, accessoireId',
      stockMouvements: 'id, typeProduit, typeMouvement, dateMouvement',
      operationsFinancieres: 'id, type, compteSource, compteDestination, dateOperation'
    });
    this.version(2).stores({
      cagesModeles: 'id, nom, espece, actif',
      accessoires: 'id, nom, categorie',
      accessoiresCategories: 'id, nom',
      kits: 'id, nom, cageModeleId',
      contacts: 'id, nom, type',
      commandes: 'id, numero, clientId, dateCommande, statutCommande, statutPaiement',
      commandeLignes: 'id, commandeId, cageModeleId, accessoireId',
      fabrications: 'id, numero, menuisierId, dateCommande, statut',
      fabricationLignes: 'id, fabricationId, cageModeleId',
      achats: 'id, fournisseurId, dateAchat',
      achatLignes: 'id, achatId, accessoireId',
      stocks: 'id, typeProduit, cageModeleId, accessoireId',
      stockMouvements: 'id, typeProduit, typeMouvement, dateMouvement',
      operationsFinancieres: 'id, type, compteSource, compteDestination, dateOperation'
    });
    this.version(3).stores({
      cagesModeles: 'id, nom, espece, actif',
      cagesCategories: 'id, nom',
      accessoires: 'id, nom, categorie',
      accessoiresCategories: 'id, nom',
      kits: 'id, nom, cageModeleId',
      contacts: 'id, nom, type',
      commandes: 'id, numero, clientId, dateCommande, statutCommande, statutPaiement',
      commandeLignes: 'id, commandeId, cageModeleId, accessoireId',
      fabrications: 'id, numero, menuisierId, dateCommande, statut',
      fabricationLignes: 'id, fabricationId, cageModeleId',
      achats: 'id, fournisseurId, dateAchat',
      achatLignes: 'id, achatId, accessoireId',
      stocks: 'id, typeProduit, cageModeleId, accessoireId',
      stockMouvements: 'id, typeProduit, typeMouvement, dateMouvement',
      operationsFinancieres: 'id, type, compteSource, compteDestination, dateOperation'
    });
  }
}

export const db = new SengageDatabase();
