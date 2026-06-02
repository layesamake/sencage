import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { StockService } from '../services/stockService';
import { AlertCircle, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export const StockView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cages' | 'accessoires'>('cages');
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  
  // États de correction de stock
  const [corrType, setCorrType] = useState<'cage' | 'accessoire'>('cage');
  const [corrCageId, setCorrCageId] = useState('');
  const [corrAccId, setCorrAccId] = useState('');
  const [corrQty, setCorrQty] = useState(0);

  // Charger les stocks
  const stocks = useLiveQuery(async () => {
    const list = await StockService.getStocks();
    const joined = [];

    for (const s of list) {
      let nom = 'Inconnu';
      let details = '';
      let alerte = false;
      let seuil = 0;

      if (s.typeProduit === 'cage' && s.cageModeleId) {
        const c = await db.cagesModeles.get(s.cageModeleId);
        nom = c ? c.nom : 'Cage';
        details = c ? c.espece : 'Cage';
        alerte = s.quantiteDisponible === 0;
      } else if (s.typeProduit === 'accessoire' && s.accessoireId) {
        const a = await db.accessoires.get(s.accessoireId);
        nom = a ? a.nom : 'Accessoire';
        details = a ? a.categorie : 'Matériel';
        seuil = a ? a.seuilStockFaible : 0;
        alerte = s.quantiteDisponible <= seuil;
      }

      joined.push({
        ...s,
        nom,
        details,
        alerte,
        seuil
      });
    }

    return joined;
  }, []);

  // Charger l'historique des derniers mouvements
  const mouvements = useLiveQuery(async () => {
    const list = await db.stockMouvements.reverse().limit(10).toArray();
    const joined = [];
    for (const m of list) {
      let nomArticle = 'Inconnu';
      if (m.typeProduit === 'cage' && m.cageModeleId) {
        const c = await db.cagesModeles.get(m.cageModeleId);
        nomArticle = c ? `${c.nom} (${c.espece})` : 'Cage';
      } else if (m.typeProduit === 'accessoire' && m.accessoireId) {
        const a = await db.accessoires.get(m.accessoireId);
        nomArticle = a ? a.nom : 'Accessoire';
      }
      joined.push({
        ...m,
        nomArticle
      });
    }
    return joined;
  }, []);

  const modelesCages = useLiveQuery(() => db.cagesModeles.filter(c => c.actif).toArray(), []);
  const accessoires = useLiveQuery(() => db.accessoires.toArray(), []);

  const handleCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (corrType === 'cage' && !corrCageId) return alert("Sélectionnez une cage");
    if (corrType === 'accessoire' && !corrAccId) return alert("Sélectionnez un accessoire");

    try {
      await StockService.addMouvement({
        typeProduit: corrType,
        cageModeleId: corrType === 'cage' ? corrCageId : undefined,
        accessoireId: corrType === 'accessoire' ? corrAccId : undefined,
        typeMouvement: 'correction',
        quantite: corrQty,
        observation: "Ajustement d'inventaire physique"
      });

      alert("Stock corrigé.");
      setShowCorrectionForm(false);
      setCorrQty(0);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const getMouvementIcon = (type: string) => {
    switch (type) {
      case 'entree': return <ArrowUpRight className="h-4 w-4 text-sengageGreen" />;
      case 'sortie': return <ArrowDownRight className="h-4 w-4 text-sengageRed" />;
      case 'reservation': return <ClockIcon />;
      default: return <RefreshCw className="h-4 w-4 text-sengageOrange" />;
    }
  };

  const ClockIcon = () => (
    <svg className="h-4 w-4 text-sengageOrange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-xs">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Stock SENGAGE</h2>
        <button
          onClick={() => setShowCorrectionForm(true)}
          className="px-3.5 py-1.5 bg-sengageOrange text-white font-bold rounded-xl active:scale-95 transition-all"
        >
          Ajustement
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface rounded-2xl p-1 border border-sengageSubText/5">
        <button
          onClick={() => setActiveTab('cages')}
          className={`flex-1 py-2 text-center rounded-xl font-semibold transition-all ${
            activeTab === 'cages' ? 'bg-background text-sengageGreen font-bold shadow-inner' : 'text-sengageSubText'
          }`}
        >
          Cages d'Élevage
        </button>
        <button
          onClick={() => setActiveTab('accessoires')}
          className={`flex-1 py-2 text-center rounded-xl font-semibold transition-all ${
            activeTab === 'accessoires' ? 'bg-background text-sengageGreen font-bold shadow-inner' : 'text-sengageSubText'
          }`}
        >
          Accessoires
        </button>
      </div>

      {/* Liste des Stocks */}
      <div className="flex flex-col gap-3">
        {stocks
          ?.filter(s => activeTab === 'cages' ? s.typeProduit === 'cage' : s.typeProduit === 'accessoire')
          .map(s => (
            <div key={s.id} className="card-sengage flex flex-col gap-2 relative border border-sengageSubText/5">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-sm">{s.nom}</h4>
                  <span className="text-[10px] text-sengageSubText/60 capitalize">{s.details}</span>
                </div>
                {s.alerte && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-sengageRed bg-sengageRed/10 border border-sengageRed/25 px-1.5 py-0.5 rounded-md">
                    <AlertCircle className="h-3 w-3" />
                    <span>{activeTab === 'cages' ? 'Rupture' : 'Stock Bas'}</span>
                  </span>
                )}
              </div>

              {activeTab === 'cages' ? (
                <div className="grid grid-cols-3 gap-2 border-t border-sengageSubText/5 pt-2 mt-1 text-center">
                  <div>
                    <span className="text-[9px] text-sengageSubText">Dispo</span>
                    <div className="font-bold text-white text-sm">{s.quantiteDisponible}</div>
                  </div>
                  <div className="border-x border-sengageSubText/5">
                    <span className="text-[9px] text-sengageSubText">Réservé</span>
                    <div className="font-bold text-sengageOrange text-sm">{s.quantiteReservee}</div>
                  </div>
                  <div>
                    <span className="text-[9px] text-sengageSubText">En fab.</span>
                    <div className="font-bold text-white text-sm">{s.quantiteEnFabrication}</div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center border-t border-sengageSubText/5 pt-2 mt-1">
                  <div>
                    <span className="text-[9px] text-sengageSubText block">Stock Disponible</span>
                    <span className="font-bold text-white text-sm">{s.quantiteDisponible}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-sengageSubText block">Seuil Alerte</span>
                    <span className="font-bold text-sengageSubText/80">{s.seuil}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Mouvements récents */}
      <div className="card-sengage flex flex-col gap-2 mt-2">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Mouvements récents</h3>
        <div className="flex flex-col gap-2">
          {mouvements?.map(m => (
            <div key={m.id} className="flex justify-between items-center py-1.5 border-b border-sengageSubText/5 last:border-0">
              <div className="flex items-center gap-2">
                <div className="bg-background p-1.5 rounded-lg border border-sengageSubText/5">
                  {getMouvementIcon(m.typeMouvement)}
                </div>
                <div>
                  <div className="font-bold text-white">{m.nomArticle}</div>
                  <span className="text-[9px] text-sengageSubText block uppercase">{m.typeMouvement}</span>
                </div>
              </div>
              <span className="font-black text-white text-sm">
                {m.typeMouvement === 'sortie' || m.typeMouvement === 'reservation' ? '-' : '+'}{m.quantite}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modale d'ajustement de stock */}
      {showCorrectionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <form onSubmit={handleCorrection} className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4">
            <h3 className="font-black text-sm text-white border-b border-sengageSubText/5 pb-3">Ajustement d'Inventaire</h3>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCorrType('cage')}
                className={`flex-1 py-1.5 rounded-xl border text-xs ${
                  corrType === 'cage' ? 'bg-sengageGreen/10 border-sengageGreen text-sengageGreen' : 'bg-background/40 border-sengageSubText/5 text-sengageSubText'
                }`}
              >
                Cage
              </button>
              <button
                type="button"
                onClick={() => setCorrType('accessoire')}
                className={`flex-1 py-1.5 rounded-xl border text-xs ${
                  corrType === 'accessoire' ? 'bg-sengageGreen/10 border-sengageGreen text-sengageGreen' : 'bg-background/40 border-sengageSubText/5 text-sengageSubText'
                }`}
              >
                Accessoire
              </button>
            </div>

            {corrType === 'cage' ? (
              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Cage d'élevage</label>
                <select
                  value={corrCageId}
                  onChange={(e) => setCorrCageId(e.target.value)}
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                >
                  <option value="">-- Choisissez --</option>
                  {modelesCages?.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.espece})</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Accessoire</label>
                <select
                  value={corrAccId}
                  onChange={(e) => setCorrAccId(e.target.value)}
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                >
                  <option value="">-- Choisissez --</option>
                  {accessoires?.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-[10px] text-sengageSubText block mb-1">Nouvelle quantité disponible</label>
              <input
                type="number"
                value={corrQty}
                onChange={(e) => setCorrQty(Number(e.target.value))}
                className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-xs"
              >
                Corriger
              </button>
              <button
                type="button"
                onClick={() => setShowCorrectionForm(false)}
                className="flex-1 py-2.5 bg-background text-sengageSubText rounded-xl border border-sengageSubText/10 active:scale-95 transition-all text-xs"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
