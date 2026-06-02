export type RouteName =
  | 'verrouillage'
  | 'accueil'
  | 'commandes'
  | 'nouvelle_commande'
  | 'detail_commande'
  | 'fabrications'
  | 'nouvelle_fabrication'
  | 'detail_fabrication'
  | 'stock'
  | 'produits'
  | 'finances'
  | 'contacts'
  | 'achats'
  | 'rapports'
  | 'parametres';

// Cette interface définit les informations de navigation
export interface RouteConfig {
  name: RouteName;
  label: string;
  isMainNavigation: boolean; // S'il apparaît dans la barre basse (5 entrées obligatoires)
  icon?: string; // Nom de l'icône Lucide
}

export const routes: RouteConfig[] = [
  { name: 'verrouillage', label: 'Verrouillage', isMainNavigation: false },
  { name: 'accueil', label: 'Accueil', isMainNavigation: true, icon: 'Home' },
  { name: 'commandes', label: 'Commandes', isMainNavigation: true, icon: 'ShoppingBag' },
  { name: 'fabrications', label: 'Fabrication', isMainNavigation: true, icon: 'Hammer' },
  { name: 'stock', label: 'Stock', isMainNavigation: true, icon: 'Package' },
  { name: 'finances', label: 'Finances', isMainNavigation: true, icon: 'DollarSign' },
  // Routes secondaires accessibles depuis des boutons ou menus
  { name: 'nouvelle_commande', label: 'Nouvelle commande', isMainNavigation: false },
  { name: 'detail_commande', label: 'Détail commande', isMainNavigation: false },
  { name: 'nouvelle_fabrication', label: 'Nouvelle fabrication', isMainNavigation: false },
  { name: 'detail_fabrication', label: 'Détail fabrication', isMainNavigation: false },
  { name: 'produits', label: 'Produits et Kits', isMainNavigation: false },
  { name: 'contacts', label: 'Contacts', isMainNavigation: false },
  { name: 'achats', label: 'Achats Fournisseurs', isMainNavigation: false },
  { name: 'rapports', label: 'Rapports', isMainNavigation: false },
  { name: 'parametres', label: 'Paramètres', isMainNavigation: false }
];
