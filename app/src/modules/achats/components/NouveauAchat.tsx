import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useAppStore } from '../../../store/useAppStore';
import { AchatsService } from '../services/achatsService';
import { ContactsService } from '../../contacts/services/contactsService';
import { ArrowLeft, Trash, AlertCircle } from 'lucide-react';
import type { CompteType } from '../../../types';

export const NouveauAchat: React.FC = () => {
  const { setActiveTab } = useAppStore();

  const [selectedFournisseurId, setSelectedFournisseurId] = useState('');
  const [comptePaiement, setComptePaiement] = useState<CompteType>('caisse');
  const [observation, setObservation] = useState('');

  // Lignes d'achat
  const [lignes, setLignes] = useState<any[]>([]);

  // Ligne courante
  const [selectedAccId, setSelectedAccId] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [prixUnitaireAchat, setPrixUnitaireAchat] = useState(0);

  // Charger fournisseurs et accessoires
  const fournisseurs = useLiveQuery(() => ContactsService.getContactsByType('fournisseur'), []);
  const accessoires = useLiveQuery(() => db.accessoires.toArray(), []);

  const handleAccChange = (itemId: string) => {
    setSelectedAccId(itemId);
    const acc = accessoires?.find(a => a.id === itemId);
    setPrixUnitaireAchat(acc ? acc.prixAchat : 0);
  };

  const handleAddLigne = () => {
    if (!selectedAccId) return alert("Sélectionnez un accessoire.");
    if (quantite <= 0) return alert("Quantité incorrecte.");

    const existIndex = lignes.findIndex(l => l.accessoireId === selectedAccId);
    if (existIndex > -1) {
      const nextLignes = [...lignes];
      nextLignes[existIndex].quantite += quantite;
      setLignes(nextLignes);
    } else {
      const nomArticle = accessoires?.find(a => a.id === selectedAccId)?.nom;
      setLignes([...lignes, {
        accessoireId: selectedAccId,
        quantite,
        prixUnitaireAchat,
        nomArticle
      }]);
    }

    setQuantite(1);
    setPrixUnitaireAchat(0);
    setSelectedAccId('');
  };

  const handleRemoveLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const totalAchat = lignes.reduce((sum, l) => sum + (l.quantite * l.prixUnitaireAchat), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFournisseurId) return alert("Veuillez choisir un fournisseur.");
    if (lignes.length === 0) return alert("Veuillez insérer au moins une ligne d'achat.");

    try {
      await AchatsService.createAchat(
        {
          fournisseurId: selectedFournisseurId,
          dateAchat: new Date(),
          comptePaiement,
          montantTotal: totalAchat,
          observation
        },
        lignes
      );

      alert("Achat fournisseur enregistré. Stock mis à jour.");
      setActiveTab('stock');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-6 animate-fade-in text-xs">
      <div className="flex items-center gap-3">
        <button 
          type="button" 
          onClick={() => setActiveTab('stock')}
          className="p-2 bg-surface hover:bg-surface/80 rounded-xl text-sengageSubText"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-bold text-white">Achat Fournisseur</h2>
      </div>

      <div className="bg-sengageOrange/10 border border-sengageOrange/25 p-3 rounded-2xl flex gap-2">
        <AlertCircle className="h-5 w-5 text-sengageOrange shrink-0" />
        <p className="text-sengageText leading-relaxed">
          <strong>Paiement comptant obligatoire.</strong> Les achats fournisseurs ne font pas l'objet de crédit dans la V1. Le solde sera débité immédiatement du compte sélectionné.
        </p>
      </div>

      {/* Général */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Informations Générales</h3>
        
        <div>
          <label className="text-[10px] text-sengageSubText block mb-1">Fournisseur</label>
          <select
            value={selectedFournisseurId}
            onChange={(e) => setSelectedFournisseurId(e.target.value)}
            className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
          >
            <option value="">-- Choisissez --</option>
            {fournisseurs?.map(f => (
              <option key={f.id} value={f.id}>{f.nom} ({f.telephone})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-sengageSubText block mb-1 font-semibold">Compte de règlement</label>
          <select
            value={comptePaiement}
            onChange={(e: any) => setComptePaiement(e.target.value)}
            className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white"
          >
            <option value="caisse">Espèces (Caisse)</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-sengageSubText block mb-1">Observation / Note d'achat</label>
          <input
            type="text"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Ex: Achat tuyaux d'abreuvoirs..."
            className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
          />
        </div>
      </div>

      {/* Accessoires à ajouter */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Ajouter des Accessoires</h3>
        
        <div>
          <label className="text-[10px] text-sengageSubText block mb-1">Accessoire</label>
          <select
            value={selectedAccId}
            onChange={(e) => handleAccChange(e.target.value)}
            className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
          >
            <option value="">-- Sélectionnez un accessoire --</option>
            {accessoires?.map(a => (
              <option key={a.id} value={a.id}>{a.nom} - Réf. Achat {a.prixAchat.toLocaleString()} F</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Prix unitaire payé</label>
            <input
              type="number"
              value={prixUnitaireAchat}
              onChange={(e) => setPrixUnitaireAchat(Number(e.target.value))}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Quantité achetée</label>
            <input
              type="number"
              value={quantite}
              onChange={(e) => setQuantite(Number(e.target.value))}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddLigne}
          className="w-full py-2 bg-sengageOrange/15 border border-sengageOrange/30 text-sengageOrange hover:bg-sengageOrange/25 rounded-xl font-bold transition-all active:scale-95 mt-2"
        >
          Ajouter à la liste d'achat
        </button>
      </div>

      {/* Lignes d'achat panier */}
      {lignes.length > 0 && (
        <div className="card-sengage flex flex-col gap-2">
          <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Matériels inclus</h3>
          <div className="flex flex-col gap-2">
            {lignes.map((l, index) => (
              <div key={index} className="flex justify-between items-center bg-background/30 p-2 rounded-xl border border-sengageSubText/5">
                <div>
                  <div className="font-bold text-white">{l.nomArticle}</div>
                  <div className="text-[10px] text-sengageSubText">{l.quantite} unité(s) @ {l.prixUnitaireAchat.toLocaleString()} F</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLigne(index)}
                  className="p-1.5 text-sengageRed hover:bg-sengageRed/10 rounded-lg transition-all"
                >
                  <Trash className="h-4.5 w-4.5" />
                </button>
              </div>
            ))}
            
            <div className="flex justify-between items-center border-t border-sengageSubText/5 pt-3 mt-1 text-white text-sm font-black">
              <span>Règlement Cash Total :</span>
              <span className="text-sengageGreen">{totalAchat.toLocaleString()} F CFA</span>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={lignes.length === 0}
        className="w-full py-3.5 bg-sengageGreen disabled:opacity-50 hover:bg-sengageGreen/80 text-background font-bold rounded-2xl shadow-xl transition-all active:scale-95 text-sm"
      >
        Enregistrer et Valider l'Achat
      </button>
    </form>
  );
};
