import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { routes, type RouteName } from '../routes/routes';
import { 
  Home, 
  ShoppingBag, 
  Hammer, 
  Package, 
  DollarSign, 
  Settings, 
  WifiOff, 
  Lock, 
  Users,
  Layers
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { activeTab, setActiveTab, isOffline, setOffline } = useAppStore();
  const { lock } = useAuthStore();

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [setOffline]);

  // Associer les icônes lucide-react aux noms des routes
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Home': return <Home className="h-5 w-5" />;
      case 'ShoppingBag': return <ShoppingBag className="h-5 w-5" />;
      case 'Hammer': return <Hammer className="h-5 w-5" />;
      case 'Package': return <Package className="h-5 w-5" />;
      case 'DollarSign': return <DollarSign className="h-5 w-5" />;
      default: return <Home className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-sengageText pb-20 max-w-md mx-auto shadow-2xl relative border-x border-sengageSubText/5">
      {/* Alerte Hors Ligne */}
      {isOffline && (
        <div className="bg-sengageRed/95 text-white py-1.5 px-3 flex items-center justify-center gap-2 text-xs font-semibold animate-pulse sticky top-0 z-50">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Mode Hors Ligne Activé — Stockage Local Utilisé</span>
        </div>
      )}

      {/* Barre supérieure rapide */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-sengageSubText/5 px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-sengageGreen/10 px-2.5 py-1 rounded-lg border border-sengageGreen/20">
            <span className="text-sengageGreen font-bold text-xs tracking-wider">SENGAGE</span>
          </div>
          <span className="text-white font-bold text-sm">Manager</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('produits')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'produits' ? 'bg-background text-sengageGreen' : 'text-sengageSubText hover:text-white'}`}
            title="Catalogue & Kits"
          >
            <Layers className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => setActiveTab('contacts')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'contacts' ? 'bg-background text-sengageGreen' : 'text-sengageSubText hover:text-white'}`}
            title="Contacts"
          >
            <Users className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => setActiveTab('parametres')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'parametres' ? 'bg-background text-sengageGreen' : 'text-sengageSubText hover:text-white'}`}
            title="Paramètres"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={lock}
            className="p-2 rounded-xl text-sengageSubText hover:text-sengageRed transition-all"
            title="Verrouiller"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Contenu de la Page */}
      <main className="flex-1 p-4">
        {children}
      </main>

      {/* Barre de navigation basse (5 entrées principales obligatoires) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-sengageSubText/5 py-2 px-6 flex justify-between items-center z-40 max-w-md mx-auto">
        {routes
          .filter(route => route.isMainNavigation)
          .map(route => {
            const isActive = activeTab === route.name;
            return (
              <button
                key={route.name}
                onClick={() => setActiveTab(route.name)}
                className="flex flex-col items-center gap-1 transition-all"
              >
                <div className={`p-2 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-sengageGreen/10 text-sengageGreen scale-110 shadow-inner' 
                    : 'text-sengageSubText hover:text-white'
                }`}>
                  {getIcon(route.icon)}
                </div>
                <span className={`text-[10px] font-semibold transition-all ${
                  isActive ? 'text-sengageGreen' : 'text-sengageSubText/60'
                }`}>
                  {route.label}
                </span>
              </button>
            );
          })}
      </nav>
    </div>
  );
};
