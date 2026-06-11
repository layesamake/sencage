import React, { useEffect, useState } from 'react';
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
  Layers,
  Palette,
  Plus,
  X,
  ShoppingCart,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { activeTab, setActiveTab, isOffline, setOffline, theme, setTheme } = useAppStore();
  const { lock } = useAuthStore();
  const [isFabOpen, setIsFabOpen] = useState(false);

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      {/* Alerte Hors Ligne Subtile */}
      {isOffline && (
        <div className="bg-sengageOrange/90 text-background py-1.5 px-3 flex items-center justify-center gap-2 text-[10px] font-semibold sticky top-0 z-50">
          <WifiOff className="h-3 w-3" />
          <span>Mode Hors Ligne Activé — Sauvegarde locale</span>
        </div>
      )}

      {/* Barre supérieure rapide */}
      <header className="bg-[#002E6D] backdrop-blur-md shadow-lg px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
            <span className="text-[#FFFFFF] font-bold text-xs tracking-wider">SENGAGE</span>
          </div>
          <span className="text-[#FFFFFF] font-bold text-sm">Manager</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('produits')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'produits' ? 'bg-white/10 text-[#FFCC00]' : 'text-[#FFFFFF] hover:text-[#FFCC00]/80'}`}
            title="Catalogue & Kits"
          >
            <Layers className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => setActiveTab('contacts')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'contacts' ? 'bg-white/10 text-[#FFCC00]' : 'text-[#FFFFFF] hover:text-[#FFCC00]/80'}`}
            title="Contacts"
          >
            <Users className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => setActiveTab('parametres')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'parametres' ? 'bg-white/10 text-[#FFCC00]' : 'text-[#FFFFFF] hover:text-[#FFCC00]/80'}`}
            title="Paramètres"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => {
              const themes: ('sengage' | 'mixx')[] = ['sengage', 'mixx'];
              const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
              setTheme(themes[nextIndex]);
            }}
            className="p-2 rounded-xl text-[#FFFFFF] hover:text-[#FFCC00]/80 transition-all"
            title="Changer de thème"
          >
            <Palette className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={lock}
            className="p-2 rounded-xl text-[#FFFFFF] hover:text-[#FFCC00]/80 transition-all"
            title="Verrouiller"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Contenu de la Page */}
      <main className="flex-1 p-4 pb-24">
        {children}
      </main>

      {/* Floating Action Button (FAB) Global */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3">
        {isFabOpen && (
          <div className="flex flex-col gap-3 animate-fade-in mb-2 items-end">
            <button 
              onClick={() => { setActiveTab('nouvelle_commande'); setIsFabOpen(false); }}
              className="flex items-center gap-3 bg-surface p-3 rounded-2xl shadow-xl border border-sengageSubText/10 text-white"
            >
              <span className="text-xs font-bold">Commande Client</span>
              <div className="bg-sengageGreen p-2 rounded-xl"><ShoppingCart className="h-4 w-4 text-background" /></div>
            </button>
            <button 
              onClick={() => { setActiveTab('nouvelle_fabrication'); setIsFabOpen(false); }}
              className="flex items-center gap-3 bg-surface p-3 rounded-2xl shadow-xl border border-sengageSubText/10 text-white"
            >
              <span className="text-xs font-bold">Ordre Fabrication</span>
              <div className="bg-sengageOrange p-2 rounded-xl"><Hammer className="h-4 w-4 text-background" /></div>
            </button>
            <button 
              onClick={() => { setActiveTab('achats'); setIsFabOpen(false); }}
              className="flex items-center gap-3 bg-surface p-3 rounded-2xl shadow-xl border border-sengageSubText/10 text-white"
            >
              <span className="text-xs font-bold">Achat Matériel</span>
              <div className="bg-navActiveText p-2 rounded-xl"><TrendingUpIcon className="h-4 w-4 text-navBg" /></div>
            </button>
          </div>
        )}
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isFabOpen ? 'bg-surface border border-sengageSubText/20 text-white rotate-45' : 'bg-navActiveText text-navBg scale-100 hover:scale-105'
          }`}
        >
          {isFabOpen ? <Plus className="h-6 w-6" /> : <Plus className="h-7 w-7" />}
        </button>
      </div>

      {/* Barre de navigation basse (5 entrées principales obligatoires) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-navBg backdrop-blur-lg border-t border-sengageSubText/5 py-2 px-6 flex justify-between items-center z-40 max-w-md mx-auto">
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
                    ? 'bg-navActiveBg text-navActiveText scale-110 shadow-inner' 
                    : 'text-navText hover:text-navTextHover'
                }`}>
                  {getIcon(route.icon)}
                </div>
                <span className={`text-[10px] font-semibold transition-all ${
                  isActive ? 'text-navActiveText' : 'text-navText'
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
