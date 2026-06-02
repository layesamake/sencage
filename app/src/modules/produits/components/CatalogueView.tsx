import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { ProduitsService } from '../services/produitsService';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import type { EspeceType, UniteType } from '../../../types';

export const CatalogueView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cages' | 'accessoires' | 'kits'>('cages');
  const [showAddForm, setShowAddForm] = useState(false);

  // Formulaire Cages
  const [cageNom, setCageNom] = useState('');
  const [cageEspece, setCageEspece] = useState<EspeceType>('caille');
  const [cagePrix, setCagePrix] = useState(0);
  const [cageCout, setCageCout] = useState(0);

  // Formulaire Accessoires
  const [accNom, setAccNom] = useState('');
  const [accCat, setAccCat] = useState('');
  const [accUnite, setAccUnite] = useState<UniteType>('piece');
  const [accPrixAchat, setAccPrixAchat] = useState(0);
  const [accPrixVente, setAccPrixVente] = useState(0);
  const [accSeuil, setAccSeuil] = useState(10);

  // Charger les données
  const modeles = useLiveQuery(() => ProduitsService.getCagesModeles(), []);
  const accessoires = useLiveQuery(() => ProduitsService.getAccessoires(), []);

  const handleAddCage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cageNom) return alert("Le nom est obligatoire.");

    try {
      await ProduitsService.addCageModele({
        nom: cageNom,
        espece: cageEspece,
        prixVenteBase: cagePrix,
        coutFabricationRef: cageCout,
        actif: true
      });
      alert("Modèle de cage ajouté.");
      setCageNom('');
      setCagePrix(0);
      setCageCout(0);
      setShowAddForm(false);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddAccessoire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accNom || !accCat) return alert("Veuillez remplir le nom et la catégorie.");

    try {
      await ProduitsService.addAccessoire({
        nom: accNom,
        categorie: accCat,
        unite: accUnite,
        prixAchat: accPrixAchat,
        prixVente: accPrixVente,
        seuilStockFaible: accSeuil
      });
      alert("Accessoire ajouté.");
      setAccNom('');
      setAccCat('');
      setAccPrixAchat(0);
      setAccPrixVente(0);
      setShowAddForm(false);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const toggleCageStatus = async (id: string, current: boolean) => {
    await ProduitsService.updateCageModele(id, { actif: !current });
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-xs">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Catalogue & Kits</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="p-2 bg-sengageGreen text-background hover:bg-sengageGreen/80 rounded-xl transition-all active:scale-95 flex items-center justify-center"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface rounded-2xl p-1 border border-sengageSubText/5">
        {['cages', 'accessoires', 'kits'].map((tab: any) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-center rounded-xl font-semibold capitalize transition-all ${
              activeTab === tab ? 'bg-background text-sengageGreen font-bold shadow-inner' : 'text-sengageSubText'
            }`}
          >
            {tab === 'cages' ? 'Cages' : tab}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="flex flex-col gap-3">
        {activeTab === 'cages' && modeles?.map(m => (
          <div key={m.id} className="card-sengage flex justify-between items-center border border-sengageSubText/5">
            <div>
              <h4 className="font-bold text-white text-sm">{m.nom}</h4>
              <span className="text-[10px] text-sengageSubText/60 capitalize">Espèce : {m.espece}</span>
              <div className="flex gap-4 mt-2 text-[10px] text-sengageSubText">
                <span>Vente : <strong className="text-white">{m.prixVenteBase.toLocaleString()} F</strong></span>
                <span>Coût Réf : <strong className="text-white">{m.coutFabricationRef.toLocaleString()} F</strong></span>
              </div>
            </div>
            
            <button onClick={() => toggleCageStatus(m.id, m.actif)} className="p-1">
              {m.actif ? (
                <ToggleRight className="h-7 w-7 text-sengageGreen" />
              ) : (
                <ToggleLeft className="h-7 w-7 text-sengageSubText/40" />
              )}
            </button>
          </div>
        ))}

        {activeTab === 'accessoires' && accessoires?.map(a => (
          <div key={a.id} className="card-sengage flex flex-col gap-2 border border-sengageSubText/5">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-sm">{a.nom}</h4>
                <span className="text-[10px] text-sengageSubText/60 capitalize">Catégorie : {a.categorie} | Unité : {a.unite}</span>
              </div>
            </div>
            <div className="flex gap-4 text-[10px] text-sengageSubText border-t border-sengageSubText/5 pt-2 mt-1">
              <span>Achat : <strong className="text-white">{a.prixAchat.toLocaleString()} F</strong></span>
              <span>Vente conseillée : <strong className="text-white">{a.prixVente.toLocaleString()} F</strong></span>
              <span>Seuil alerte : <strong className="text-white">{a.seuilStockFaible}</strong></span>
            </div>
          </div>
        ))}

        {activeTab === 'kits' && (
          <div className="text-center py-12 text-sengageSubText/50">
            Kits configurés (ex: Kit N3 Standard Équipée).
          </div>
        )}
      </div>

      {/* Modale d'ajout */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          {activeTab === 'cages' ? (
            <form onSubmit={handleAddCage} className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4">
              <h3 className="font-black text-sm text-white border-b border-sengageSubText/5 pb-3">Nouveau Modèle de Cage</h3>
              
              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Nom du Modèle</label>
                <input
                  type="text"
                  value={cageNom}
                  onChange={(e) => setCageNom(e.target.value)}
                  placeholder="Ex: Promax, N3 Standard..."
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Espèce d'élevage</label>
                <select
                  value={cageEspece}
                  onChange={(e: any) => setCageEspece(e.target.value)}
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                >
                  <option value="caille">Caille</option>
                  <option value="poulet">Poulet</option>
                  <option value="lapin">Lapin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-sengageSubText block mb-1">Prix de vente base (F)</label>
                  <input
                    type="number"
                    value={cagePrix}
                    onChange={(e) => setCagePrix(Number(e.target.value))}
                    className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-sengageSubText block mb-1">Coût fabrication réf. (F)</label>
                  <input
                    type="number"
                    value={cageCout}
                    onChange={(e) => setCageCout(Number(e.target.value))}
                    className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-xs"
                >
                  Ajouter
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
            <form onSubmit={handleAddAccessoire} className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4">
              <h3 className="font-black text-sm text-white border-b border-sengageSubText/5 pb-3">Nouvel Accessoire</h3>
              
              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Nom de l'Accessoire</label>
                <input
                  type="text"
                  value={accNom}
                  onChange={(e) => setAccNom(e.target.value)}
                  placeholder="Ex: Abreuvoir automatique, Tuyau..."
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Catégorie</label>
                <input
                  type="text"
                  value={accCat}
                  onChange={(e) => setAccCat(e.target.value)}
                  placeholder="Ex: Abreuvoirs, Mangeoires, Alvéoles..."
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Unité de conditionnement</label>
                <select
                  value={accUnite}
                  onChange={(e: any) => setAccUnite(e.target.value)}
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                >
                  <option value="piece">Pièce</option>
                  <option value="metre">Mètre</option>
                  <option value="rouleau">Rouleau</option>
                  <option value="lot">Lot</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-sengageSubText block mb-1">Prix Achat</label>
                  <input
                    type="number"
                    value={accPrixAchat}
                    onChange={(e) => setAccPrixAchat(Number(e.target.value))}
                    className="w-full bg-background border border-sengageSubText/10 rounded-xl p-1.5 text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-sengageSubText block mb-1">Prix Vente</label>
                  <input
                    type="number"
                    value={accPrixVente}
                    onChange={(e) => setAccPrixVente(Number(e.target.value))}
                    className="w-full bg-background border border-sengageSubText/10 rounded-xl p-1.5 text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-sengageSubText block mb-1">Seuil Alerte</label>
                  <input
                    type="number"
                    value={accSeuil}
                    onChange={(e) => setAccSeuil(Number(e.target.value))}
                    className="w-full bg-background border border-sengageSubText/10 rounded-xl p-1.5 text-white text-center"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-xs"
                >
                  Ajouter
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
