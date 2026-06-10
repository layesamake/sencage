import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { ProduitsService } from '../services/produitsService';
import { Plus, ToggleLeft, ToggleRight, Folder, Edit2, Trash2, X, Check } from 'lucide-react';
import type { EspeceType, UniteType } from '../../../types';

export const CatalogueView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cages' | 'accessoires' | 'kits'>('cages');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCageId, setEditingCageId] = useState<string | null>(null);
  const [viewingCageId, setViewingCageId] = useState<string | null>(null);
  const [viewingAccId, setViewingAccId] = useState<string | null>(null);
  const [viewingKitId, setViewingKitId] = useState<string | null>(null);

  // Formulaire Cages
  const [cageNom, setCageNom] = useState('');
  const [cageEspece, setCageEspece] = useState<EspeceType>('');
  const [cagePrix, setCagePrix] = useState(0);
  const [cageCout, setCageCout] = useState(0);

  // Formulaire Accessoires
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [accNom, setAccNom] = useState('');
  const [accCat, setAccCat] = useState('');
  const [accUnite, setAccUnite] = useState<UniteType>('piece');
  const [accPrixAchat, setAccPrixAchat] = useState(0);
  const [accPrixVente, setAccPrixVente] = useState(0);
  const [accSeuil, setAccSeuil] = useState(10);

  // Formulaire Kits
  const [editingKitId, setEditingKitId] = useState<string | null>(null);
  const [kitNom, setKitNom] = useState('');
  const [kitCageId, setKitCageId] = useState('');
  const [kitAccessoires, setKitAccessoires] = useState<{accessoireId: string, quantite: number}[]>([]);

  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const initCategories = async () => {
      try {
        await ProduitsService.ensureCagesCategoriesSeeded();
        await ProduitsService.ensureAccessoiresCategoriesSeeded();
      } catch (err) {
        console.error("Erreur d'initialisation des catégories :", err);
        setDbError((err as Error).message || "Erreur d'initialisation des catégories");
      }
    };
    initCategories();
  }, []);

  // Charger les données
  const modeles = useLiveQuery(async () => {
    try {
      return await ProduitsService.getCagesModeles();
    } catch (e) {
      console.error("Erreur cagesModeles:", e);
      setDbError((e as Error).message || "Erreur modèles de cages");
      return [];
    }
  }, []);

  const accessoires = useLiveQuery(async () => {
    try {
      return await ProduitsService.getAccessoires();
    } catch (e) {
      console.error("Erreur accessoires:", e);
      setDbError((e as Error).message || "Erreur accessoires");
      return [];
    }
  }, []);

  const categories = useLiveQuery(async () => {
    try {
      return await ProduitsService.getAccessoiresCategories();
    } catch (e) {
      console.error("Erreur accessoiresCategories:", e);
      setDbError((e as Error).message || "Erreur catégories d'accessoires");
      return [];
    }
  }, []);

  const cagesCategories = useLiveQuery(async () => {
    try {
      return await ProduitsService.getCagesCategories();
    } catch (e) {
      console.error("Erreur cagesCategories:", e);
      setDbError((e as Error).message || "Erreur catégories de cages");
      return [];
    }
  }, []);

  const kits = useLiveQuery(async () => {
    try {
      return await ProduitsService.getKits();
    } catch (e) {
      console.error("Erreur kits:", e);
      setDbError((e as Error).message || "Erreur kits");
      return [];
    }
  }, []);

  // Gestion des catégories d'accessoires
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');

  // Gestion des catégories de cages
  const [showCageCategoryManager, setShowCageCategoryManager] = useState(false);
  const [newCageCatName, setNewCageCatName] = useState('');
  const [editingCageCatId, setEditingCageCatId] = useState<string | null>(null);
  const [editingCageCatName, setEditingCageCatName] = useState('');
  const [showQuickAddCageCat, setShowQuickAddCageCat] = useState(false);
  const [quickCageCatName, setQuickCageCatName] = useState('');

  const handleAddCage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cageNom || !cageEspece) return alert("Veuillez remplir le nom et la catégorie.");

    try {
      if (editingCageId) {
        await ProduitsService.updateCageModele(editingCageId, {
          nom: cageNom,
          espece: cageEspece,
          prixVenteBase: cagePrix,
          coutFabricationRef: cageCout
        });
        alert("Modèle de cage modifié.");
      } else {
        await ProduitsService.addCageModele({
          nom: cageNom,
          espece: cageEspece,
          prixVenteBase: cagePrix,
          coutFabricationRef: cageCout,
          actif: true
        });
        alert("Modèle de cage ajouté.");
      }
      setCageNom('');
      setCageEspece('');
      setCagePrix(0);
      setCageCout(0);
      setEditingCageId(null);
      setShowAddForm(false);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddAccessoire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accNom || !accCat) return alert("Veuillez remplir le nom et la catégorie.");

    try {
      if (editingAccId) {
        await ProduitsService.updateAccessoire(editingAccId, {
          nom: accNom,
          categorie: accCat,
          unite: accUnite,
          prixAchat: accPrixAchat,
          prixVente: accPrixVente,
          seuilStockFaible: accSeuil
        });
        alert("Accessoire modifié.");
      } else {
        await ProduitsService.addAccessoire({
          nom: accNom,
          categorie: accCat,
          unite: accUnite,
          prixAchat: accPrixAchat,
          prixVente: accPrixVente,
          seuilStockFaible: accSeuil
        });
        alert("Accessoire ajouté.");
      }
      setAccNom('');
      setAccCat('');
      setAccUnite('piece');
      setAccPrixAchat(0);
      setAccPrixVente(0);
      setAccSeuil(10);
      setEditingAccId(null);
      setShowAddForm(false);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitNom || !kitCageId) return alert("Veuillez remplir le nom et sélectionner une cage.");
    if (kitAccessoires.length === 0) return alert("Veuillez ajouter au moins un accessoire.");

    try {
      if (editingKitId) {
        await ProduitsService.updateKit(editingKitId, {
          nom: kitNom,
          cageModeleId: kitCageId,
          accessoires: kitAccessoires
        });
        alert("Kit modifié.");
      } else {
        await ProduitsService.addKit({
          nom: kitNom,
          cageModeleId: kitCageId,
          accessoires: kitAccessoires
        });
        alert("Kit ajouté.");
      }
      setKitNom('');
      setKitCageId('');
      setKitAccessoires([]);
      setEditingKitId(null);
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
        <h2 className="text-xl font-bold text-sengageText">Catalogue & Kits</h2>
        <button
          onClick={() => {
            if (activeTab === 'cages') {
              setEditingCageId(null);
              setCageNom('');
              setCageEspece('');
              setCagePrix(0);
              setCageCout(0);
            } else if (activeTab === 'accessoires') {
              setEditingAccId(null);
              setAccNom('');
              setAccCat('');
              setAccUnite('piece');
              setAccPrixAchat(0);
              setAccPrixVente(0);
              setAccSeuil(10);
            } else if (activeTab === 'kits') {
              setEditingKitId(null);
              setKitNom('');
              setKitCageId('');
              setKitAccessoires([]);
            }
            setShowAddForm(true);
          }}
          className="p-2 bg-sengageGreen text-background hover:bg-sengageGreen/80 rounded-xl transition-all active:scale-95 flex items-center justify-center"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {dbError && (
        <div className="bg-sengageRed/20 border border-sengageRed/45 text-sengageRed p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2">
          <span>⚠️ Problème de base de données : {dbError}. Essayez de recharger la page.</span>
          <button onClick={() => setDbError(null)} className="font-bold hover:text-white">✕</button>
        </div>
      )}

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
        {activeTab === 'cages' && (() => {
          const list = modeles || [];
          const grouped: { [key: string]: typeof list } = {};
          
          list.forEach(m => {
            const cat = m.espece || 'Divers';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(m);
          });

          const catNames = Object.keys(grouped).sort();

          if (list.length === 0) {
            return (
              <div className="text-center py-12 text-sengageSubText/50">
                Aucun modèle de cage enregistré.
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-1 gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sengageSubText/60">
                  {list.length} modèles au total
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('cages');
                      setEditingCageId(null);
                      setCageNom('');
                      setCageEspece('');
                      setCagePrix(0);
                      setCageCout(0);
                      setShowAddForm(true);
                    }}
                    className="px-2.5 py-1.5 bg-sengageGreen text-background font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Nouveau Modèle</span>
                  </button>
                  <button
                    onClick={() => setShowCageCategoryManager(true)}
                    className="px-2.5 py-1.5 bg-surface hover:bg-background border border-sengageSubText/10 hover:border-sengageGreen/30 text-sengageGreen font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                    title="Gérer les catégories de cages"
                  >
                    <Folder className="h-3.5 w-3.5" />
                    <span>Catégories</span>
                  </button>
                </div>
              </div>

              {catNames.map(cat => {
                const listForCat = grouped[cat] || [];
                return (
                  <div key={cat} className="flex flex-col gap-2">
                    <h5 className="font-extrabold text-white text-xs border-l-2 border-sengageGreen pl-2 mt-2 capitalize flex items-center justify-between">
                      <span>{cat}</span>
                      <span className="text-[9px] font-normal text-sengageSubText/75 px-1.5 py-0.2 bg-surface rounded-full">
                        {listForCat.length}
                      </span>
                    </h5>
                    {listForCat.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => setViewingCageId(m.id)}
                        className="card-sengage cursor-pointer flex justify-between items-center border border-sengageSubText/5 hover:border-sengageGreen/30 transition-all"
                      >
                        <div>
                          <h4 className="font-bold text-white text-sm">{m.nom}</h4>
                          <div className="flex gap-4 mt-2 text-[10px] text-sengageSubText">
                            <span>Vente : <strong className="text-white">{m.prixVenteBase.toLocaleString()} F</strong></span>
                            <span>Coût Réf : <strong className="text-white">{m.coutFabricationRef.toLocaleString()} F</strong></span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCageStatus(m.id, m.actif);
                            }} 
                            className="p-1"
                          >
                            {m.actif ? (
                              <ToggleRight className="h-7 w-7 text-sengageGreen" />
                            ) : (
                              <ToggleLeft className="h-7 w-7 text-sengageSubText/40" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {activeTab === 'accessoires' && (() => {
          const list = accessoires || [];
          const grouped: { [key: string]: typeof list } = {};
          
          list.forEach(a => {
            const cat = a.categorie || 'Divers';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(a);
          });

          const catNames = Object.keys(grouped).sort();

          if (list.length === 0) {
            return (
              <div className="text-center py-12 text-sengageSubText/50">
                Aucun accessoire enregistré.
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-1 gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sengageSubText/60">
                  {list.length} accessoires au total
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('accessoires');
                      setEditingAccId(null);
                      setAccNom('');
                      setAccCat('');
                      setAccUnite('piece');
                      setAccPrixAchat(0);
                      setAccPrixVente(0);
                      setAccSeuil(10);
                      setShowAddForm(true);
                    }}
                    className="px-2.5 py-1.5 bg-sengageGreen text-background font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Nouvel Accessoire</span>
                  </button>
                  <button
                    onClick={() => setShowCategoryManager(true)}
                    className="px-2.5 py-1.5 bg-surface hover:bg-background border border-sengageSubText/10 hover:border-sengageGreen/30 text-sengageGreen font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                    title="Gérer les catégories d'accessoires"
                  >
                    <Folder className="h-3.5 w-3.5" />
                    <span>Catégories</span>
                  </button>
                </div>
              </div>

              {catNames.map(cat => {
                const listForCat = grouped[cat] || [];
                return (
                  <div key={cat} className="flex flex-col gap-2">
                    <h5 className="font-extrabold text-white text-xs border-l-2 border-sengageGreen pl-2 mt-2 capitalize flex items-center justify-between">
                      <span>{cat}</span>
                      <span className="text-[9px] font-normal text-sengageSubText/75 px-1.5 py-0.2 bg-surface rounded-full">
                        {listForCat.length}
                      </span>
                    </h5>
                    {listForCat.map(a => (
                      <div 
                        key={a.id} 
                        onClick={() => setViewingAccId(a.id)}
                        className="card-sengage cursor-pointer flex flex-col gap-2 border border-sengageSubText/5 hover:border-sengageGreen/30 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-sm">{a.nom}</h4>
                            <span className="text-[10px] text-sengageSubText/60 capitalize">Unité : {a.unite}</span>
                          </div>
                        </div>
                        <div className="flex gap-4 text-[10px] text-sengageSubText border-t border-sengageSubText/5 pt-2 mt-1">
                          <span>Achat : <strong className="text-white">{a.prixAchat.toLocaleString()} F</strong></span>
                          <span>Vente conseillée : <strong className="text-white">{a.prixVente.toLocaleString()} F</strong></span>
                          <span>Seuil alerte : <strong className="text-white">{a.seuilStockFaible}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {activeTab === 'kits' && (() => {
          const list = kits || [];
          if (list.length === 0) {
            return (
              <div className="text-center py-12 text-sengageSubText/50">
                Aucun kit enregistré.
              </div>
            );
          }
          return (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-1 gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sengageSubText/60">
                  {list.length} kits au total
                </span>
                <button
                  onClick={() => {
                    setActiveTab('kits');
                    setEditingKitId(null);
                    setKitNom('');
                    setKitCageId('');
                    setKitAccessoires([]);
                    setShowAddForm(true);
                  }}
                  className="px-2.5 py-1.5 bg-sengageGreen text-background font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nouveau Kit</span>
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {list.map(k => {
                  const cage = modeles?.find(m => m.id === k.cageModeleId);
                  return (
                    <div 
                      key={k.id} 
                      onClick={() => setViewingKitId(k.id)}
                      className="card-sengage cursor-pointer flex justify-between items-center border border-sengageSubText/5 hover:border-sengageGreen/30 transition-all"
                    >
                      <div>
                        <h4 className="font-bold text-white text-sm">{k.nom}</h4>
                        <span className="text-[10px] text-sengageSubText">Cage: {cage?.nom || 'Inconnue'} ({k.accessoires.length} accessoires)</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Supprimer le kit ${k.nom} ?`)) {
                              await ProduitsService.deleteKit(k.id);
                            }
                          }}
                          className="p-1.5 text-sengageSubText hover:text-sengageRed rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Fiche Cage (Lecture Seule) */}
      {viewingCageId && (() => {
        const cage = modeles?.find(m => m.id === viewingCageId);
        if (!cage) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4 relative">
              <button 
                onClick={() => setViewingCageId(null)}
                className="absolute top-4 right-4 text-sengageSubText hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h3 className="font-black text-lg text-white border-b border-sengageSubText/5 pb-3 pr-8">
                Fiche Modèle de Cage
              </h3>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[10px] text-sengageSubText block mb-0.5">Nom du modèle</span>
                  <div className="font-bold text-white text-base">{cage.nom}</div>
                </div>
                <div>
                  <span className="text-[10px] text-sengageSubText block mb-0.5">Catégorie</span>
                  <div className="font-semibold text-white text-sm capitalize">{cage.espece}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-background p-3 rounded-xl border border-sengageSubText/5">
                  <div>
                    <span className="text-[10px] text-sengageSubText block mb-0.5">Prix de vente</span>
                    <div className="font-black text-sengageGreen">{cage.prixVenteBase.toLocaleString()} F</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-sengageSubText block mb-0.5">Coût de fabrication</span>
                    <div className="font-bold text-white">{cage.coutFabricationRef.toLocaleString()} F</div>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-sengageSubText block mb-0.5">Statut</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${cage.actif ? 'bg-sengageGreen/20 text-sengageGreen' : 'bg-sengageSubText/20 text-sengageSubText'}`}>
                      {cage.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-sengageSubText/5">
                <button
                  onClick={() => {
                    setViewingCageId(null);
                    setEditingCageId(cage.id);
                    setCageNom(cage.nom);
                    setCageEspece(cage.espece);
                    setCagePrix(cage.prixVenteBase);
                    setCageCout(cage.coutFabricationRef);
                    setShowAddForm(true);
                  }}
                  className="flex-1 py-2.5 bg-sengageGreen/10 hover:bg-sengageGreen/20 text-sengageGreen font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Modifier le modèle</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Fiche Accessoire (Lecture Seule) */}
      {viewingAccId && (() => {
        const acc = accessoires?.find(a => a.id === viewingAccId);
        if (!acc) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4 relative">
              <button 
                onClick={() => setViewingAccId(null)}
                className="absolute top-4 right-4 text-sengageSubText hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h3 className="font-black text-lg text-white border-b border-sengageSubText/5 pb-3 pr-8">
                Fiche Accessoire
              </h3>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[10px] text-sengageSubText block mb-0.5">Nom</span>
                  <div className="font-bold text-white text-base">{acc.nom}</div>
                </div>
                <div>
                  <span className="text-[10px] text-sengageSubText block mb-0.5">Catégorie</span>
                  <div className="font-semibold text-white text-sm capitalize">{acc.categorie}</div>
                </div>
                <div>
                  <span className="text-[10px] text-sengageSubText block mb-0.5">Unité</span>
                  <div className="font-semibold text-white text-sm capitalize">{acc.unite}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-background p-3 rounded-xl border border-sengageSubText/5">
                  <div>
                    <span className="text-[10px] text-sengageSubText block mb-0.5">Prix Achat</span>
                    <div className="font-bold text-white">{acc.prixAchat.toLocaleString()} F</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-sengageSubText block mb-0.5">Prix Vente</span>
                    <div className="font-black text-sengageGreen">{acc.prixVente.toLocaleString()} F</div>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-sengageSubText block mb-0.5">Seuil d'alerte stock</span>
                  <div className="font-semibold text-sengageRed text-sm">{acc.seuilStockFaible}</div>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-sengageSubText/5">
                <button
                  onClick={() => {
                    setViewingAccId(null);
                    setEditingAccId(acc.id);
                    setAccNom(acc.nom);
                    setAccCat(acc.categorie);
                    setAccUnite(acc.unite);
                    setAccPrixAchat(acc.prixAchat);
                    setAccPrixVente(acc.prixVente);
                    setAccSeuil(acc.seuilStockFaible);
                    setShowAddForm(true);
                  }}
                  className="flex-1 py-2.5 bg-sengageGreen/10 hover:bg-sengageGreen/20 text-sengageGreen font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Modifier l'accessoire</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Fiche Kit (Lecture Seule) */}
      {viewingKitId && (() => {
        const kit = kits?.find(k => k.id === viewingKitId);
        if (!kit) return null;
        const cage = modeles?.find(m => m.id === kit.cageModeleId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setViewingKitId(null)}
                className="absolute top-4 right-4 text-sengageSubText hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h3 className="font-black text-lg text-white border-b border-sengageSubText/5 pb-3 pr-8">
                Fiche Kit
              </h3>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[10px] text-sengageSubText block mb-0.5">Nom du kit</span>
                  <div className="font-bold text-white text-base">{kit.nom}</div>
                </div>
                <div>
                  <span className="text-[10px] text-sengageSubText block mb-0.5">Cage associée</span>
                  <div className="font-semibold text-white text-sm">{cage?.nom || 'Inconnue'}</div>
                </div>
                
                <div className="mt-2">
                  <span className="text-[10px] text-sengageSubText block mb-1">Accessoires inclus</span>
                  <div className="bg-background rounded-xl border border-sengageSubText/5 p-2 flex flex-col gap-2">
                    {kit.accessoires.map((ka, idx) => {
                      const acc = accessoires?.find(a => a.id === ka.accessoireId);
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-white">{acc?.nom || 'Inconnu'}</span>
                          <span className="text-sengageSubText font-bold bg-surface px-2 py-0.5 rounded-md">x{ka.quantite}</span>
                        </div>
                      );
                    })}
                    {kit.accessoires.length === 0 && (
                      <div className="text-xs text-sengageSubText/50 text-center py-2">Aucun accessoire</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-sengageSubText/5">
                <button
                  onClick={() => {
                    setViewingKitId(null);
                    setEditingKitId(kit.id);
                    setKitNom(kit.nom);
                    setKitCageId(kit.cageModeleId);
                    setKitAccessoires(kit.accessoires);
                    setShowAddForm(true);
                  }}
                  className="flex-1 py-2.5 bg-sengageGreen/10 hover:bg-sengageGreen/20 text-sengageGreen font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Modifier le kit</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modale d'ajout */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          {activeTab === 'cages' ? (
            <form onSubmit={handleAddCage} className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4">
              <h3 className="font-black text-sm text-white border-b border-sengageSubText/5 pb-3">
                {editingCageId ? "Modifier le Modèle de Cage" : "Nouveau Modèle de Cage"}
              </h3>
              
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
                <label className="text-[10px] text-sengageSubText block mb-1">Catégorie de cage</label>
                {!showQuickAddCageCat ? (
                  <div className="flex gap-2">
                    <select
                      value={cageEspece}
                      onChange={(e) => setCageEspece(e.target.value)}
                      className="flex-1 bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white capitalize text-xs"
                    >
                      <option value="">-- Sélectionner --</option>
                      {cagesCategories?.map(c => (
                        <option key={c.id} value={c.nom}>{c.nom}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCageCat(true)}
                      className="p-2.5 bg-sengageGreen/10 border border-sengageGreen/20 hover:bg-sengageGreen/20 text-sengageGreen rounded-xl font-bold active:scale-95 transition-all"
                      title="Créer une nouvelle catégorie de cage"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={quickCageCatName}
                      onChange={(e) => setQuickCageCatName(e.target.value)}
                      placeholder="Nouvelle catégorie..."
                      className="flex-1 bg-background border border-sengageSubText/10 rounded-xl p-2 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!quickCageCatName.trim()) return;
                        try {
                          await ProduitsService.addCageCategorie(quickCageCatName);
                          setCageEspece(quickCageCatName.trim());
                          setQuickCageCatName('');
                          setShowQuickAddCageCat(false);
                        } catch (err) {
                          alert((err as Error).message);
                        }
                      }}
                      className="p-2 bg-sengageGreen text-background hover:bg-sengageGreen/80 rounded-xl font-bold"
                    >
                      <Check className="h-4.5 w-4.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCageCatName('');
                        setShowQuickAddCageCat(false);
                      }}
                      className="p-2 bg-background border border-sengageSubText/10 text-sengageSubText rounded-xl hover:bg-surface"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}
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
                  {editingCageId ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCageId(null);
                    setCageNom('');
                    setCageEspece('');
                    setCagePrix(0);
                    setCageCout(0);
                  }}
                  className="flex-1 py-2.5 bg-background text-sengageSubText rounded-xl border border-sengageSubText/10 active:scale-95 transition-all text-xs"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : activeTab === 'accessoires' ? (
            <form onSubmit={handleAddAccessoire} className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4">
              <h3 className="font-black text-sm text-white border-b border-sengageSubText/5 pb-3">
                {editingAccId ? "Modifier l'Accessoire" : "Nouvel Accessoire"}
              </h3>
              
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
                {!showQuickAddCat ? (
                  <div className="flex gap-2">
                    <select
                      value={accCat}
                      onChange={(e) => setAccCat(e.target.value)}
                      className="flex-1 bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white capitalize text-xs"
                    >
                      <option value="">-- Sélectionner --</option>
                      {categories?.map(c => (
                        <option key={c.id} value={c.nom}>{c.nom}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCat(true)}
                      className="p-2.5 bg-sengageGreen/10 border border-sengageGreen/20 hover:bg-sengageGreen/20 text-sengageGreen rounded-xl font-bold active:scale-95 transition-all"
                      title="Créer une nouvelle catégorie"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={quickCatName}
                      onChange={(e) => setQuickCatName(e.target.value)}
                      placeholder="Nouvelle catégorie..."
                      className="flex-1 bg-background border border-sengageSubText/10 rounded-xl p-2 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!quickCatName.trim()) return;
                        try {
                          await ProduitsService.addAccessoireCategorie(quickCatName);
                          setAccCat(quickCatName.trim());
                          setQuickCatName('');
                          setShowQuickAddCat(false);
                        } catch (err) {
                          alert((err as Error).message);
                        }
                      }}
                      className="p-2 bg-sengageGreen text-background hover:bg-sengageGreen/80 rounded-xl font-bold"
                    >
                      <Check className="h-4.5 w-4.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCatName('');
                        setShowQuickAddCat(false);
                      }}
                      className="p-2 bg-background border border-sengageSubText/10 text-sengageSubText rounded-xl hover:bg-surface"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}
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
                  {editingAccId ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingAccId(null);
                    setAccNom('');
                    setAccCat('');
                    setAccUnite('piece');
                    setAccPrixAchat(0);
                    setAccPrixVente(0);
                    setAccSeuil(10);
                  }}
                  className="flex-1 py-2.5 bg-background text-sengageSubText rounded-xl border border-sengageSubText/10 active:scale-95 transition-all text-xs"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : activeTab === 'kits' ? (
            <form onSubmit={handleAddKit} className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-black text-sm text-white border-b border-sengageSubText/5 pb-3">
                {editingKitId ? "Modifier le Kit" : "Nouveau Kit"}
              </h3>
              
              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Nom du Kit</label>
                <input
                  type="text"
                  value={kitNom}
                  onChange={(e) => setKitNom(e.target.value)}
                  placeholder="Ex: Kit N3 Complet"
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-sengageSubText block mb-1">Modèle de Cage</label>
                <select
                  value={kitCageId}
                  onChange={(e) => setKitCageId(e.target.value)}
                  className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white text-xs"
                >
                  <option value="">-- Sélectionner une cage --</option>
                  {modeles?.map(m => (
                    <option key={m.id} value={m.id}>{m.nom} ({m.espece})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-sengageSubText block">Accessoires inclus</label>
                  <button type="button" onClick={() => setKitAccessoires([...kitAccessoires, {accessoireId: '', quantite: 1}])} className="text-[10px] text-sengageGreen font-bold">+ Ajouter</button>
                </div>
                {kitAccessoires.map((ka, index) => (
                  <div key={index} className="flex gap-2 mb-2 items-center">
                    <select
                      value={ka.accessoireId}
                      onChange={(e) => {
                        const newAcc = [...kitAccessoires];
                        newAcc[index].accessoireId = e.target.value;
                        setKitAccessoires(newAcc);
                      }}
                      className="flex-1 bg-background border border-sengageSubText/10 rounded-lg p-2 text-white text-xs"
                    >
                      <option value="">-- Accessoire --</option>
                      {accessoires?.map(a => (
                        <option key={a.id} value={a.id}>{a.nom}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={ka.quantite}
                      onChange={(e) => {
                        const newAcc = [...kitAccessoires];
                        newAcc[index].quantite = Number(e.target.value);
                        setKitAccessoires(newAcc);
                      }}
                      className="w-16 bg-background border border-sengageSubText/10 rounded-lg p-2 text-white text-xs text-center"
                    />
                    <button type="button" onClick={() => {
                      const newAcc = kitAccessoires.filter((_, i) => i !== index);
                      setKitAccessoires(newAcc);
                    }} className="text-sengageRed p-1"><X className="h-4 w-4"/></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-2">
                <button type="submit" className="flex-1 py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-xs">
                  {editingKitId ? "Modifier" : "Ajouter"}
                </button>
                <button type="button" onClick={() => {
                  setShowAddForm(false);
                  setEditingKitId(null);
                  setKitNom('');
                  setKitCageId('');
                  setKitAccessoires([]);
                }} className="flex-1 py-2.5 bg-background text-sengageSubText rounded-xl border border-sengageSubText/10 active:scale-95 transition-all text-xs">
                  Annuler
                </button>
              </div>
            </form>
          ) : null}
        </div>
      )}

      {/* Modale de Gestion des Catégories */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-sengageSubText/5 pb-3">
              <h3 className="font-black text-sm text-white">Gestion des Catégories</h3>
              <button
                onClick={() => {
                  setShowCategoryManager(false);
                  setEditingCatId(null);
                }}
                className="p-1 text-sengageSubText hover:text-white rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Ajouter une catégorie */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCatName.trim()) return;
                try {
                  await ProduitsService.addAccessoireCategorie(newCatName);
                  setNewCatName('');
                } catch (err) {
                  alert((err as Error).message);
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ex: Éclairage, Isolation..."
                className="flex-1 bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
              />
              <button
                type="submit"
                className="px-4 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-xs"
              >
                Ajouter
              </button>
            </form>

            {/* Liste des catégories */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 mt-2">
              {categories?.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 bg-background/40 border border-sengageSubText/5 rounded-xl">
                  {editingCatId === c.id ? (
                    <div className="flex gap-2 items-center flex-1">
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="flex-1 bg-background border border-sengageGreen/40 rounded-lg p-1.5 text-white text-xs"
                      />
                      <button
                        onClick={async () => {
                          try {
                            await ProduitsService.updateAccessoireCategorie(c.id, editingCatName);
                            setEditingCatId(null);
                          } catch (err) {
                            alert((err as Error).message);
                          }
                        }}
                        className="p-1 text-sengageGreen hover:bg-sengageGreen/10 rounded"
                      >
                        <Check className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="p-1 text-sengageSubText hover:bg-surface rounded"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-white text-xs capitalize">{c.nom}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingCatId(c.id);
                            setEditingCatName(c.nom);
                          }}
                          className="p-1.5 text-sengageSubText hover:text-white rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {c.nom.toLowerCase() !== 'divers' && (
                          <button
                            onClick={async () => {
                              if (confirm(`Voulez-vous vraiment supprimer la catégorie "${c.nom}" ? Tous ses accessoires seront reclassés en "Divers".`)) {
                                try {
                                  await ProduitsService.deleteAccessoireCategorie(c.id);
                                } catch (err) {
                                  alert((err as Error).message);
                                }
                              }
                            }}
                            className="p-1.5 text-sengageSubText hover:text-sengageRed rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modale de Gestion des Catégories de Cages */}
      {showCageCategoryManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-sengageSubText/5 pb-3">
              <h3 className="font-black text-sm text-white">Catégories de Cages</h3>
              <button
                onClick={() => {
                  setShowCageCategoryManager(false);
                  setEditingCageCatId(null);
                }}
                className="p-1 text-sengageSubText hover:text-white rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Ajouter une catégorie */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCageCatName.trim()) return;
                try {
                  await ProduitsService.addCageCategorie(newCageCatName);
                  setNewCageCatName('');
                } catch (err) {
                  alert((err as Error).message);
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newCageCatName}
                onChange={(e) => setNewCageCatName(e.target.value)}
                placeholder="Ex: Cage Pigeon..."
                className="flex-1 bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
              />
              <button
                type="submit"
                className="px-4 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-xs"
              >
                Ajouter
              </button>
            </form>

            {/* Liste des catégories */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 mt-2">
              {cagesCategories?.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 bg-background/40 border border-sengageSubText/5 rounded-xl">
                  {editingCageCatId === c.id ? (
                    <div className="flex gap-2 items-center flex-1">
                      <input
                        type="text"
                        value={editingCageCatName}
                        onChange={(e) => setEditingCageCatName(e.target.value)}
                        className="flex-1 bg-background border border-sengageGreen/40 rounded-lg p-1.5 text-white text-xs"
                      />
                      <button
                        onClick={async () => {
                          try {
                            await ProduitsService.updateCageCategorie(c.id, editingCageCatName);
                            setEditingCageCatId(null);
                          } catch (err) {
                            alert((err as Error).message);
                          }
                        }}
                        className="p-1 text-sengageGreen hover:bg-sengageGreen/10 rounded"
                      >
                        <Check className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => setEditingCageCatId(null)}
                        className="p-1 text-sengageSubText hover:bg-surface rounded"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-white text-xs capitalize">{c.nom}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingCageCatId(c.id);
                            setEditingCageCatName(c.nom);
                          }}
                          className="p-1.5 text-sengageSubText hover:text-white rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {c.nom.toLowerCase() !== 'divers' && (
                          <button
                            onClick={async () => {
                              if (confirm(`Voulez-vous vraiment supprimer la catégorie "${c.nom}" ? Tous ses modèles seront reclassés en "Divers".`)) {
                                try {
                                  await ProduitsService.deleteCageCategorie(c.id);
                                } catch (err) {
                                  alert((err as Error).message);
                                }
                              }
                            }}
                            className="p-1.5 text-sengageSubText hover:text-sengageRed rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
