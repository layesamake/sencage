import React from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import { LockScreen } from './components/LockScreen';
import { Layout } from './components/Layout';
import { DashboardView } from './modules/dashboard';
import { CommandesList, NouvelleCommande, DetailCommande } from './modules/commandes';
import { FabricationsList, NouvelleFabrication, DetailFabrication } from './modules/fabrications';
import { StockView } from './modules/stock';
import { CatalogueView } from './modules/produits';
import { FinancesView } from './modules/finances';
import { ContactsView } from './modules/contacts';
import { NouveauAchat } from './modules/achats';
import { RapportsView } from './modules/rapports';
import { ParametresView } from './modules/parametres';

function App() {
  const { isLocked } = useAuthStore();
  const { activeTab } = useAppStore();

  if (isLocked) {
    return <LockScreen />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'accueil':
        return <DashboardView />;
      case 'commandes':
        return <CommandesList />;
      case 'nouvelle_commande':
        return <NouvelleCommande />;
      case 'detail_commande':
        return <DetailCommande />;
      case 'fabrications':
        return <FabricationsList />;
      case 'nouvelle_fabrication':
        return <NouvelleFabrication />;
      case 'detail_fabrication':
        return <DetailFabrication />;
      case 'stock':
        return <StockView />;
      case 'produits':
        return <CatalogueView />;
      case 'finances':
        return <FinancesView />;
      case 'contacts':
        return <ContactsView />;
      case 'achats':
        return <NouveauAchat />;
      case 'rapports':
        return <RapportsView />;
      case 'parametres':
        return <ParametresView />;
      default:
        return <DashboardView />;
    }
  };

  return <Layout>{renderActiveView()}</Layout>;
}

export default App;
