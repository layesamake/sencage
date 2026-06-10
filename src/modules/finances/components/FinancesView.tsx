import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { FinancesService } from '../services/financesService';
import { Plus, Send, Wallet, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import type { CompteType, OperationFinanciere } from '../../../types';

export const FinancesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'encaissements' | 'decaissements' | 'transferts'>('encaissements');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formMode, setFormMode] = useState<'transaction' | 'transfert'>('transaction');

  // État transaction simple
  const [txType, setTxType] = useState<'encaissement' | 'decaissement'>('encaissement');
  const [txCompte, setTxCompte] = useState<CompteType>('caisse');
  const [txMontant, setTxMontant] = useState(0);
  const [txCat, setTxCat] = useState('depense_diverse');
  const [txObs, setTxObs] = useState('');

  // État transfert
  const [tfSource, setTfSource] = useState<CompteType>('caisse');
  const [tfDest, setTfDest] = useState<CompteType>('wave');
  const [tfMontant, setTfMontant] = useState(0);
  const [tfObs, setTfObs] = useState('');

  // Charger les soldes
  const soldes = useLiveQuery(() => FinancesService.getSoldesSynthese(), []);

  // Charger les opérations filtrées
  const operations = useLiveQuery(async () => {
    const list = await db.operationsFinancieres.reverse().sortBy('dateOperation');
    return list.filter(op => {
      if (activeTab === 'encaissements') return op.type === 'encaissement';
      if (activeTab === 'decaissements') return op.type === 'decaissement';
      return op.type === 'transfert_interne';
    });
  }, [activeTab]);

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (txMontant <= 0) return alert("Montant incorrect.");

    try {
      if (txType === 'decaissement') {
        const soldeSource = await FinancesService.getSolde(txCompte);
        if (soldeSource < txMontant) return alert("Solde insuffisant pour ce décaissement.");
      }

      await FinancesService.addOperation({
        type: txType,
        compteSource: txType === 'decaissement' ? txCompte : 'none',
        compteDestination: txType === 'encaissement' ? txCompte : 'none',
        montant: txMontant,
        categorie: txCat,
        observation: txObs
      });

      alert("Opération enregistrée.");
      setShowAddForm(false);
      setTxMontant(0);
      setTxObs('');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleTransfertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tfMontant <= 0) return alert("Montant incorrect.");

    try {
      await FinancesService.transferer(tfSource, tfDest, tfMontant, tfObs);
      alert("Transfert effectué.");
      setShowAddForm(false);
      setTfMontant(0);
      setTfObs('');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const formatFCFA = (val?: number) => {
    if (val === undefined) return '0 F CFA';
    return `${val.toLocaleString('fr-FR')} F`;
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-xs">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Trésorerie & Comptes</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setFormMode('transfert'); setShowAddForm(true); }}
            className="p-2 bg-surface hover:bg-surface/80 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center border border-sengageSubText/10"
            title="Transfert Interne"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => { setFormMode('transaction'); setShowAddForm(true); }}
            className="p-2 bg-sengageGreen text-background hover:bg-sengageGreen/80 rounded-xl transition-all active:scale-95 flex items-center justify-center"
            title="Enregistrer Transaction"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Soldes */}
      <div className="card-sengage bg-gradient-to-br from-surface to-background/50 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sengageSubText">
            <Wallet className="h-4.5 w-4.5" />
            <span className="text-xs font-semibold">Total Disponible</span>
          </div>
          <span className="text-2xl font-black text-sengageGreen">
            {formatFCFA(soldes?.total)}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 border-t border-sengageSubText/5 pt-3 text-center">
          <div>
            <div className="text-[10px] text-sengageSubText">Caisse</div>
            <div className="font-bold text-white text-xs mt-0.5">{formatFCFA(soldes?.caisse)}</div>
          </div>
          <div className="border-x border-sengageSubText/5">
            <div className="text-[10px] text-sengageSubText">Wave</div>
            <div className="font-bold text-white text-xs mt-0.5">{formatFCFA(soldes?.wave)}</div>
          </div>
          <div>
            <div className="text-[10px] text-sengageSubText">OM</div>
            <div className="font-bold text-white text-xs mt-0.5">{formatFCFA(soldes?.orangeMoney)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface rounded-2xl p-1 border border-sengageSubText/5">
        {['encaissements', 'decaissements', 'transferts'].map((tab: any) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-center rounded-xl font-semibold capitalize transition-all ${
              activeTab === tab ? 'bg-background text-sengageGreen font-bold shadow-inner' : 'text-sengageSubText'
            }`}
          >
            {tab === 'transferts' ? 'Transferts' : tab}
          </button>
        ))}
      </div>

      {/* Liste des Opérations */}
      <div className="flex flex-col gap-2">
        {operations && operations.length > 0 ? (
          operations.map(op => (
            <div key={op.id} className="card-sengage flex justify-between items-center py-2.5 border border-sengageSubText/5">
              <div className="flex items-center gap-2">
                <div className="bg-background p-1.5 rounded-lg border border-sengageSubText/5">
                  {op.type === 'encaissement' && <ArrowUpRight className="h-4 w-4 text-sengageGreen" />}
                  {op.type === 'decaissement' && <ArrowDownRight className="h-4 w-4 text-sengageRed" />}
                  {op.type === 'transfert_interne' && <ArrowLeftRight className="h-4 w-4 text-sengageOrange" />}
                </div>
                <div>
                  <div className="font-bold text-white capitalize">{op.observation || op.categorie.replace('_', ' ')}</div>
                  <span className="text-[9px] text-sengageSubText/60 block">
                    {new Date(op.dateOperation).toLocaleDateString('fr-FR')} | {op.type === 'transfert_interne' ? `${op.compteSource} -> ${op.compteDestination}` : (op.compteSource === 'none' ? op.compteDestination : op.compteSource)}
                  </span>
                </div>
              </div>
              <span className={`font-black text-sm ${op.type === 'encaissement' ? 'text-sengageGreen' : op.type === 'decaissement' ? 'text-sengageRed' : 'text-sengageOrange'}`}>
                {op.type === 'encaissement' ? '+' : op.type === 'decaissement' ? '-' : ''}{op.montant.toLocaleString()} F
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-sengageSubText/50">
            Aucune opération enregistrée.
          </div>
        )}
      </div>

      {/* Modale d'ajout d'écriture */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          {formMode === 'transaction' ? (
            <form onSubmit={handleTransactionSubmit} className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4">
              <h3 className="font-black text-sm text-white border-b border-sengageSubText/5 pb-3">Enregistrer une transaction</h3>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('encaissement')}
                  className={`flex-1 py-1.5 rounded-xl border text-xs ${
                    txType === 'encaissement' ? 'bg-sengageGreen/10 border-sengageGreen text-sengageGreen' : 'bg-background/40 border-sengageSubText/5 text-sengageSubText'
                  }`}
                >
                  Encaissement (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('decaissement')}
                  className={`flex-1 py-1.5 rounded-xl border text-xs ${
                    txType === 'decaissement' ? 'bg-sengageRed/10 border-sengageRed text-sengageRed' : 'bg-background/40 border-sengageSubText/5 text-sengageSubText'
                  }`}
                >
                  Décaissement (-)
                </button>
              </div>

              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Compte financier</label>
                <select
                  value={txCompte}
                  onChange={(e: any) => setTxCompte(e.target.value)}
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                >
                  <option value="caisse">Espèces (Caisse)</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-sengageSubText block mb-1">Montant (F CFA)</label>
                  <input
                    type="number"
                    value={txMontant}
                    onChange={(e) => setTxMontant(Number(e.target.value))}
                    className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-sengageSubText block mb-1">Catégorie</label>
                  <select
                    value={txCat}
                    onChange={(e) => setTxCat(e.target.value)}
                    className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white"
                  >
                    <option value="depense_diverse">Dépense diverse</option>
                    <option value="transport_recuperation">Transport cages</option>
                    <option value="frais_livraison">Frais livraison</option>
                    <option value="divers_gain">Autre gain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Observation</label>
                <input
                  type="text"
                  value={txObs}
                  onChange={(e) => setTxObs(e.target.value)}
                  placeholder="Ex: Achat fournitures..."
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-xs"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 bg-background text-sengageSubText rounded-xl border border-sengageSubText/10 active:scale-95 transition-all text-xs"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleTransfertSubmit} className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4">
              <h3 className="font-black text-sm text-white border-b border-sengageSubText/5 pb-3">Faire un transfert interne</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-sengageSubText block mb-1">Compte Source</label>
                  <select
                    value={tfSource}
                    onChange={(e: any) => setTfSource(e.target.value)}
                    className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white"
                  >
                    <option value="caisse">Espèces (Caisse)</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-sengageSubText block mb-1">Compte Destination</label>
                  <select
                    value={tfDest}
                    onChange={(e: any) => setTfDest(e.target.value)}
                    className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white"
                  >
                    <option value="caisse">Espèces (Caisse)</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Montant à transférer (F CFA)</label>
                <input
                  type="number"
                  value={tfMontant}
                  onChange={(e) => setTfMontant(Number(e.target.value))}
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Note de transfert</label>
                <input
                  type="text"
                  value={tfObs}
                  onChange={(e) => setTfObs(e.target.value)}
                  placeholder="Ex: Rechargement Wave..."
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-xs"
                >
                  Confirmer le transfert
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 bg-background text-sengageSubText rounded-xl border border-sengageSubText/10 active:scale-95 transition-all text-xs"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
