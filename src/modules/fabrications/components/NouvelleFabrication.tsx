import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useAppStore } from '../../../store/useAppStore';
import { FabricationsService } from '../services/fabricationsService';
import { ContactsService } from '../../contacts/services/contactsService';
import { ArrowLeft, Trash } from 'lucide-react';

export const NouvelleFabrication: React.FC = () => {
  const { setActiveTab } = useAppStore();

  // États du formulaire
  const [selectedMenuisierId, setSelectedMenuisierId] = useState('');
  const [datePrevue, setDatePrevue] = useState('');
  const [observation, setObservation] = useState('');

  // Lignes de fabrication
  const [lignes, setLignes] = useState<any[]>([]);

  // Ligne courante
  const [selectedCageId, setSelectedCageId] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [coutUnitaireNegocie, setCoutUnitaireNegocie] = useState(0);

  // Financier
  const [avancePayee, setAvancePayee] = useState(0);
  const [remise, setRemise] = useState(0);
  const [comptePaiement, setComptePaiement] = useState<'caisse' | 'wave' | 'orange_money'>('caisse');

  // Requêtes Dexie pour les dropdowns
  const menuisiers = useLiveQuery(() => ContactsService.getContactsByType('menuisier'), []);
  const modelesCages = useLiveQuery(() => db.cagesModeles.filter(c => c.actif).toArray(), []);

  const handleCageChange = (itemId: string) => {
    setSelectedCageId(itemId);
    const cage = modelesCages?.find(c => c.id === itemId);
    setCoutUnitaireNegocie(cage ? cage.coutFabricationRef : 0);
  };

  const handleAddLigne = () => {
    if (!selectedCageId) return alert("Sélectionnez un modèle de cage");
    if (quantite <= 0) return alert("Quantité incorrecte");

    const existIndex = lignes.findIndex(l => l.cageModeleId === selectedCageId);
    if (existIndex > -1) {
      const nextLignes = [...lignes];
      nextLignes[existIndex].quantite += quantite;
      setLignes(nextLignes);
    } else {
      const nomArticle = modelesCages?.find(c => c.id === selectedCageId)?.nom;
      setLignes([...lignes, {
        cageModeleId: selectedCageId,
        quantite,
        coutUnitaireNegocie,
        nomArticle
      }]);
    }

    setQuantite(1);
    setCoutUnitaireNegocie(0);
    setSelectedCageId('');
  };

  const handleRemoveLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  // Calculs financiers consolidés
  const totalArticles = lignes.reduce((sum, l) => sum + (l.quantite * l.coutUnitaireNegocie), 0);
  const totalFabrication = totalArticles - remise;
  const reliquat = Math.max(0, totalFabrication - avancePayee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuisierId) return alert("Veuillez sélectionner un menuisier.");
    if (!datePrevue) return alert("Veuillez choisir une date prévue de réception.");
    if (lignes.length === 0) return alert("Veuillez ajouter au moins un modèle à fabriquer.");

    try {
      await FabricationsService.createFabrication(
        {
          menuisierId: selectedMenuisierId,
          dateCommande: new Date(),
          datePrevue: new Date(datePrevue),
          avancePayee,
          remise,
          observation
        },
        lignes,
        avancePayee > 0 ? comptePaiement : undefined
      );

      alert("Commande de fabrication enregistrée.");
      setActiveTab('fabrications');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-6 animate-fade-in text-xs">
      <div className="flex items-center gap-3">
        <button 
          type="button" 
          onClick={() => setActiveTab('fabrications')}
          className="p-2 bg-surface hover:bg-surface/80 rounded-xl text-sengageSubText"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-bold text-sengageText">Nouvelle Fabrication</h2>
      </div>

      {/* Informations menuisier */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Général</h3>
        <div>
          <label className="text-[10px] text-sengageSubText font-semibold block mb-1">Sélectionner le Menuisier</label>
          <select
            value={selectedMenuisierId}
            onChange={(e) => setSelectedMenuisierId(e.target.value)}
            className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-sengageGreen"
          >
            <option value="">-- Choisissez un menuisier --</option>
            {menuisiers?.map(m => (
              <option key={m.id} value={m.id}>{m.nom} ({m.telephone})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-sengageSubText font-semibold block mb-1">Date prévue de réception</label>
          <input
            type="date"
            value={datePrevue}
            onChange={(e) => setDatePrevue(e.target.value)}
            className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-sengageSubText font-semibold block mb-1">Observation / Consignes</label>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Ex: Utiliser du bois rouge traité..."
            className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white focus:outline-none h-16"
          />
        </div>
      </div>

      {/* Cages à commander */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Modèles à Fabriquer</h3>
        
        <div>
          <label className="text-[10px] text-sengageSubText block mb-1">Modèle de cage</label>
          <select
            value={selectedCageId}
            onChange={(e) => handleCageChange(e.target.value)}
            className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white focus:outline-none"
          >
            <option value="">-- Sélectionnez un modèle --</option>
            {modelesCages?.map(c => (
              <option key={c.id} value={c.id}>{c.nom} ({c.espece}) - Réf. {c.coutFabricationRef.toLocaleString()} F</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Coût unitaire négocié</label>
            <input
              type="number"
              value={coutUnitaireNegocie}
              onChange={(e) => setCoutUnitaireNegocie(Number(e.target.value))}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Quantité</label>
            <input
              type="number"
              value={quantite}
              onChange={(e) => setQuantite(Number(e.target.value))}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddLigne}
          className="w-full py-2 bg-sengageOrange/15 border border-sengageOrange/30 text-sengageOrange hover:bg-sengageOrange/25 rounded-xl font-bold transition-all active:scale-95 mt-2"
        >
          Ajouter à la fabrication
        </button>
      </div>

      {/* Panier de fabrication */}
      {lignes.length > 0 && (
        <div className="card-sengage flex flex-col gap-2">
          <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Modèles inclus</h3>
          <div className="flex flex-col gap-2">
            {lignes.map((l, index) => (
              <div key={index} className="flex justify-between items-center bg-background/30 p-2 rounded-xl border border-sengageSubText/5">
                <div>
                  <div className="font-bold text-white">{l.nomArticle}</div>
                  <div className="text-[10px] text-sengageSubText">{l.quantite} unité(s) @ {l.coutUnitaireNegocie.toLocaleString()} F</div>
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
          </div>
        </div>
      )}

      {/* Paiement Avance */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Règlement Acompte</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Remise obtenue (F CFA)</label>
            <input
              type="number"
              value={remise}
              onChange={(e) => setRemise(Number(e.target.value))}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Avance payée (F CFA)</label>
            <input
              type="number"
              value={avancePayee}
              onChange={(e) => setAvancePayee(Number(e.target.value))}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white focus:outline-none"
            />
          </div>
        </div>

        {avancePayee > 0 && (
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Compte de débit</label>
            <select
              value={comptePaiement}
              onChange={(e: any) => setComptePaiement(e.target.value)}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white focus:outline-none"
            >
              <option value="caisse">Espèces (Caisse)</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1 border-t border-sengageSubText/5 pt-3">
          <div className="flex justify-between">
            <span className="text-sengageSubText">Coût Total :</span>
            <span className="text-white font-bold">{totalArticles.toLocaleString()} F CFA</span>
          </div>
          <div className="flex justify-between border-t border-dashed border-sengageSubText/5 mt-1 pt-1">
            <span className="text-sengageSubText">Reste dû au menuisier :</span>
            <span className="text-sengageOrange font-black text-sm">{reliquat.toLocaleString()} F CFA</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 bg-sengageGreen hover:bg-sengageGreen/80 text-background font-bold rounded-2xl shadow-xl transition-all active:scale-95 text-sm"
      >
        Enregistrer la Fabrication
      </button>
    </form>
  );
};
