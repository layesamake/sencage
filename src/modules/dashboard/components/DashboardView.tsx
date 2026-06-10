import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useAppStore } from '../../../store/useAppStore';
import { RapportsService } from '../../rapports/services/rapportsService';
import { FinancesService } from '../../finances/services/financesService';
import { 
  TrendingUp, 
  Clock, 
  Hammer, 
  AlertTriangle, 
  Wallet, 
  PlusCircle, 
  Layers,
  BookOpen,
  BarChart3
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { setActiveTab } = useAppStore();

  // Requêtes Dexie en temps réel
  const stats = useLiveQuery(async () => {
    // 1. Calcul de la trésorerie
    const finances = await FinancesService.getSoldesSynthese();

    // 2. Commandes clients en attente de stock ou à livrer
    const cmdAttente = await db.commandes
      .filter(c => c.statutCommande === 'en_attente_stock' || c.statutCommande === 'reservee' || c.statutCommande === 'equipee')
      .toArray();

    // 3. Fabrications en cours
    const fabEnCours = await db.fabrications
      .filter(f => f.statut === 'commandee' || f.statut === 'en_fabrication' || f.statut === 'terminee')
      .toArray();

    // 4. Clients débiteurs
    const debiteurs = await RapportsService.getClientsDebiteurs();
    const totalDebiteurs = debiteurs.reduce((sum, d) => sum + d.reliquatTotal, 0);

    // 5. Montant dû aux menuisiers
    const fabricationsAll = await db.fabrications.toArray();
    let totalDuMenuisiers = 0;
    for (const fab of fabricationsAll) {
      const lignes = await db.fabricationLignes.where('fabricationId').equals(fab.id).toArray();
      const totalCost = lignes.reduce((sum, l) => sum + (l.quantite * l.coutUnitaireNegocie), 0) - fab.remise;
      totalDuMenuisiers += Math.max(0, totalCost - fab.avancePayee);
    }

    // 6. Stocks faibles
    const stocks = await db.stocks.toArray();
    let stockFaibleCount = 0;
    for (const s of stocks) {
      if (s.typeProduit === 'accessoire' && s.accessoireId) {
        const acc = await db.accessoires.get(s.accessoireId);
        if (acc && s.quantiteDisponible <= acc.seuilStockFaible) {
          stockFaibleCount++;
        }
      } else if (s.typeProduit === 'cage') {
        if (s.quantiteDisponible === 0) {
          stockFaibleCount++;
        }
      }
    }

    // 7. Marge mensuelle & Ventes
    const now = new Date();
    const { ventes, marge } = await RapportsService.calculateMargeMensuelle(now.getMonth(), now.getFullYear());

    return {
      finances,
      cmdAttenteCount: cmdAttente.length,
      fabEnCoursCount: fabEnCours.length,
      totalDebiteurs,
      totalDuMenuisiers,
      stockFaibleCount,
      ventesMois: ventes,
      margeMois: marge
    };
  }, []);

  const formatFCFA = (val?: number) => {
    if (val === undefined) return '0 F CFA';
    return `${val.toLocaleString('fr-FR')} F CFA`;
  };

  const formattedDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Salutation */}
      <div>
        <h2 className="text-xl font-bold text-sengageText">Bonjour !</h2>
        <p className="text-sengageSubText text-xs capitalize">{formattedDate}</p>
      </div>



      {/* Synthèse Trésorerie */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-sengageText opacity-80 mb-1">Soldes Trésorerie</h3>
        <div 
          className="card-sengage flex flex-col gap-4 border-none"
          style={{ backgroundColor: '#FFCC00', color: '#002E6D' }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 opacity-80">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-semibold">Total Disponible</span>
            </div>
            <span className="text-2xl font-black">
              {formatFCFA(stats?.finances?.total)}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 border-t border-[#002E6D]/20 pt-3 text-center">
            <div>
              <div className="text-[10px] opacity-80">Caisse</div>
              <div className="font-bold text-xs mt-0.5">
                {formatFCFA(stats?.finances?.caisse)}
              </div>
            </div>
            <div className="border-x border-[#002E6D]/20">
              <div className="text-[10px] opacity-80">Wave</div>
              <div className="font-bold text-xs mt-0.5">
                {formatFCFA(stats?.finances?.wave)}
              </div>
            </div>
            <div>
              <div className="text-[10px] opacity-80">OM</div>
              <div className="font-bold text-xs mt-0.5">
                {formatFCFA(stats?.finances?.orangeMoney)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques Métier */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-sengageText opacity-80 mb-1">Performance & Activité</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Marge */}
          <div className="card-sengage flex flex-col gap-1 justify-between">
            <span className="text-[10px] font-semibold text-sengageSubText">Marge du Mois</span>
            <span className="text-lg font-black text-sengageGreen">
              {formatFCFA(stats?.margeMois)}
            </span>
          </div>

          {/* Ventes */}
          <div className="card-sengage flex flex-col gap-1 justify-between">
            <span className="text-[10px] font-semibold text-sengageSubText">Ventes du Mois</span>
            <span className="text-lg font-bold text-white">
              {formatFCFA(stats?.ventesMois)}
            </span>
          </div>

          {/* Commandes Attente */}
          <div className="card-sengage flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-sengageSubText">Commandes Clients</span>
              <span className="text-sm font-bold text-white">À équiper / livrer</span>
            </div>
            <span className={`text-xl font-black px-2.5 py-1 rounded-xl ${stats?.cmdAttenteCount ? 'bg-sengageOrange/10 text-sengageOrange' : 'bg-sengageSubText/5 text-sengageSubText/45'}`}>
              {stats?.cmdAttenteCount || 0}
            </span>
          </div>

          {/* Fabrications en cours */}
          <div className="card-sengage flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-sengageSubText">Fabrications</span>
              <span className="text-sm font-bold text-white">Chez menuisiers</span>
            </div>
            <span className={`text-xl font-black px-2.5 py-1 rounded-xl ${stats?.fabEnCoursCount ? 'bg-sengageOrange/10 text-sengageOrange' : 'bg-sengageSubText/5 text-sengageSubText/45'}`}>
              {stats?.fabEnCoursCount || 0}
            </span>
          </div>

          {/* Clients débiteurs */}
          <div className="card-sengage flex flex-col gap-1 justify-between col-span-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-sengageSubText">Dû par les clients (Crédit)</span>
              {stats?.totalDebiteurs ? <AlertTriangle className="h-4 w-4 text-sengageOrange" /> : null}
            </div>
            <div className="flex justify-between items-end mt-1">
              <span className={`text-lg font-black ${stats?.totalDebiteurs ? 'text-sengageRed' : 'text-sengageSubText/60'}`}>
                {formatFCFA(stats?.totalDebiteurs)}
              </span>
              {!!stats?.totalDebiteurs && (
                <button 
                  onClick={() => setActiveTab('rapports')}
                  className="bg-sengageRed/10 text-sengageRed text-[10px] font-bold px-3 py-1 rounded-lg hover:bg-sengageRed/20 transition-all active:scale-95"
                >
                  Relancer
                </button>
              )}
            </div>
          </div>

          {/* Dû menuisiers */}
          <div className="card-sengage flex flex-col gap-1 justify-between">
            <span className="text-[10px] font-semibold text-sengageSubText">Dû aux menuisiers</span>
            <span className="text-sm font-bold text-white">
              {formatFCFA(stats?.totalDuMenuisiers)}
            </span>
          </div>

          {/* Stock faible */}
          <div className="card-sengage flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-sengageSubText">Stock Faible / Rupture</span>
              <span className="text-sm font-bold text-white">Alertes</span>
            </div>
            <span className={`text-lg font-black px-2 py-0.5 rounded-lg ${stats?.stockFaibleCount ? 'bg-sengageRed/10 text-sengageRed' : 'bg-sengageSubText/5 text-sengageSubText/45'}`}>
              {stats?.stockFaibleCount || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
