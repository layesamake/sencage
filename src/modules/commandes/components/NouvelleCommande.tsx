import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useAppStore } from '../../../store/useAppStore';
import { CommandesService } from '../services/commandesService';
import { ContactsService } from '../../contacts/services/contactsService';
import { ArrowLeft, Plus, Trash } from 'lucide-react';
import type { EspeceType } from '../../../types';

export const NouvelleCommande: React.FC = () => {
  const { setActiveTab } = useAppStore();

  // Mode de sélection du client
  const [clientMode, setClientMode] = useState<'existant' | 'nouveau'>('existant');
  
  // États client existant
  const [selectedClientId, setSelectedClientId] = useState('');
  
  // États nouveau client
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');

  // États livraison
  const [lieuLivraison, setLieuLivraison] = useState('');
  const [fraisLivraison, setFraisLivraison] = useState(0);
  const [fraisSupportesPar, setFraisSupportesPar] = useState<'client' | 'sengage'>('client');
  const [observation, setObservation] = useState('');

  // Articles commandés
  const [lignes, setLignes] = useState<any[]>([]);

  // Ligne courante en cours d'ajout
  const [produitType, setProduitType] = useState<'cage' | 'accessoire'>('cage');
  const [selectedCageId, setSelectedCageId] = useState('');
  const [selectedAccessoireId, setSelectedAccessoireId] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [prixVenteReel, setPrixVenteReel] = useState(0);

  // Financier
  const [remiseGlobale, setRemiseGlobale] = useState(0);
  const [montantPaye, setMontantPaye] = useState(0);
  const [comptePaiement, setComptePaiement] = useState<'caisse' | 'wave' | 'orange_money'>('caisse');

  // Requêtes Dexie pour remplir les dropdowns
  const clients = useLiveQuery(() => ContactsService.getContactsByType('client'), []);
  const modelesCages = useLiveQuery(() => db.cagesModeles.filter(c => c.actif).toArray(), []);
  const accessoires = useLiveQuery(() => db.accessoires.toArray(), []);

  // Recalculer le prix unitaire par défaut au changement d'article
  const handleProductChange = (type: 'cage' | 'accessoire', itemId: string) => {
    if (type === 'cage') {
      setSelectedCageId(itemId);
      const cage = modelesCages?.find(c => c.id === itemId);
      setPrixVenteReel(cage ? cage.prixVenteBase : 0);
    } else {
      setSelectedAccessoireId(itemId);
      const acc = accessoires?.find(a => a.id === itemId);
      setPrixVenteReel(acc ? acc.prixVente : 0);
    }
  };

  const handleAddLigne = () => {
    if (produitType === 'cage' && !selectedCageId) return alert("Sélectionnez un modèle de cage");
    if (produitType === 'accessoire' && !selectedAccessoireId) return alert("Sélectionnez un accessoire");
    if (quantite <= 0) return alert("Quantité incorrecte");

    const existIndex = lignes.findIndex(l => 
      produitType === 'cage' 
        ? l.cageModeleId === selectedCageId 
        : l.accessoireId === selectedAccessoireId
    );

    if (existIndex > -1) {
      // Ajuster la quantité de la ligne existante
      const nextLignes = [...lignes];
      nextLignes[existIndex].quantite += quantite;
      setLignes(nextLignes);
    } else {
      // Ajouter une nouvelle ligne
      const nomArticle = produitType === 'cage'
        ? modelesCages?.find(c => c.id === selectedCageId)?.nom
        : accessoires?.find(a => a.id === selectedAccessoireId)?.nom;

      const costRef = produitType === 'cage'
        ? modelesCages?.find(c => c.id === selectedCageId)?.coutFabricationRef || 0
        : accessoires?.find(a => a.id === selectedAccessoireId)?.prixAchat || 0;

      setLignes([...lignes, {
        produitType,
        cageModeleId: produitType === 'cage' ? selectedCageId : undefined,
        accessoireId: produitType === 'accessoire' ? selectedAccessoireId : undefined,
        quantite,
        prixVenteReel,
        coutReference: costRef,
        nomArticle
      }]);
    }

    // Réinitialiser la ligne de saisie
    setQuantite(1);
    setPrixVenteReel(0);
    setSelectedCageId('');
    setSelectedAccessoireId('');
  };

  const handleRemoveLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  // Calculs financiers consolidés de la vue
  const totalArticles = lignes.reduce((sum, l) => sum + (l.quantite * l.prixVenteReel), 0);
  const totalCommande = totalArticles - remiseGlobale + fraisLivraison;
  const reliquat = Math.max(0, totalCommande - montantPaye);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lignes.length === 0) return alert("Veuillez ajouter au moins un produit.");

    try {
      let clientId = selectedClientId;

      // 1. Créer le client s'il est nouveau
      if (clientMode === 'nouveau') {
        if (!nom || !telephone) return alert("Veuillez remplir les infos du nouveau client.");
        clientId = await ContactsService.addContact({
          nom,
          telephone,
          adresse: lieuLivraison,
          type: 'client',
          observation: "Créé à la commande"
        });
      } else {
        if (!clientId) return alert("Veuillez sélectionner un client.");
      }

      // 2. Enregistrer la commande
      await CommandesService.createCommande(
        {
          clientId,
          dateCommande: new Date(),
          remiseGlobale,
          fraisLivraison,
          fraisSupportesPar,
          lieuLivraison,
          observation
        },
        lignes,
        montantPaye,
        montantPaye > 0 ? comptePaiement : undefined
      );

      alert("Commande créée avec succès.");
      setActiveTab('commandes');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-6 animate-fade-in text-xs">
      <div className="flex items-center gap-3">
        <button 
          type="button" 
          onClick={() => setActiveTab('commandes')}
          className="p-2 bg-surface hover:bg-surface/80 rounded-xl text-sengageSubText"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-bold text-sengageText">Nouvelle Commande</h2>
      </div>

      {/* Section 1 : Client */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Client</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setClientMode('existant')}
            className={`flex-1 py-2 rounded-xl border transition-all ${
              clientMode === 'existant' 
                ? 'bg-sengageGreen/10 border-sengageGreen text-sengageGreen font-bold' 
                : 'bg-background/40 border-sengageSubText/5 text-sengageSubText'
            }`}
          >
            Client Existant
          </button>
          <button
            type="button"
            onClick={() => setClientMode('nouveau')}
            className={`flex-1 py-2 rounded-xl border transition-all ${
              clientMode === 'nouveau' 
                ? 'bg-sengageGreen/10 border-sengageGreen text-sengageGreen font-bold' 
                : 'bg-background/40 border-sengageSubText/5 text-sengageSubText'
            }`}
          >
            Nouveau Client
          </button>
        </div>

        {clientMode === 'existant' ? (
          <div>
            <label className="text-[10px] text-sengageSubText font-semibold block mb-1">Sélectionner le Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-sengageGreen"
            >
              <option value="">-- Choisissez un client --</option>
              {clients?.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.telephone})</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-[10px] text-sengageSubText font-semibold block mb-1">Nom Complet</label>
              <input
                type="text"
                placeholder="Nom du client"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-sengageGreen"
              />
            </div>
            <div>
              <label className="text-[10px] text-sengageSubText font-semibold block mb-1">Numéro Téléphone / WhatsApp</label>
              <input
                type="tel"
                placeholder="Ex: 77 123 45 67"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-sengageGreen"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] text-sengageSubText font-semibold block mb-1">Lieu de livraison</label>
          <input
            type="text"
            placeholder="Adresse de livraison"
            value={lieuLivraison}
            onChange={(e) => setLieuLivraison(e.target.value)}
            className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-sengageGreen"
          />
        </div>
      </div>

      {/* Section 2 : Produits à ajouter */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Ajouter des Articles</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setProduitType('cage'); setPrixVenteReel(0); }}
            className={`flex-1 py-1.5 rounded-xl border transition-all ${
              produitType === 'cage' 
                ? 'bg-sengageGreen/10 border-sengageGreen text-sengageGreen font-semibold' 
                : 'bg-background/40 border-sengageSubText/5 text-sengageSubText'
            }`}
          >
            Cage d'Élevage
          </button>
          <button
            type="button"
            onClick={() => { setProduitType('accessoire'); setPrixVenteReel(0); }}
            className={`flex-1 py-1.5 rounded-xl border transition-all ${
              produitType === 'accessoire' 
                ? 'bg-sengageGreen/10 border-sengageGreen text-sengageGreen font-semibold' 
                : 'bg-background/40 border-sengageSubText/5 text-sengageSubText'
            }`}
          >
            Accessoire
          </button>
        </div>

        {produitType === 'cage' ? (
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Modèle de cage</label>
            <select
              value={selectedCageId}
              onChange={(e) => handleProductChange('cage', e.target.value)}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white focus:outline-none"
            >
              <option value="">-- Sélectionnez un modèle --</option>
              {modelesCages?.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.espece}) - Base {c.prixVenteBase.toLocaleString()} F</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Accessoire</label>
            <select
              value={selectedAccessoireId}
              onChange={(e) => handleProductChange('accessoire', e.target.value)}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white focus:outline-none"
            >
              <option value="">-- Sélectionnez un accessoire --</option>
              {accessoires?.map(a => (
                <option key={a.id} value={a.id}>{a.nom} - Base {a.prixVente.toLocaleString()} F</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Prix unitaire convenu</label>
            <input
              type="number"
              value={prixVenteReel}
              onChange={(e) => setPrixVenteReel(Number(e.target.value))}
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
          Insérer dans la commande
        </button>
      </div>

      {/* Section 3 : Panier */}
      {lignes.length > 0 && (
        <div className="card-sengage flex flex-col gap-2">
          <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Contenu du Panier</h3>
          <div className="flex flex-col gap-2">
            {lignes.map((l, index) => (
              <div key={index} className="flex justify-between items-center bg-background/30 p-2 rounded-xl border border-sengageSubText/5">
                <div>
                  <div className="font-bold text-white">{l.nomArticle}</div>
                  <div className="text-[10px] text-sengageSubText">{l.quantite} x {l.prixVenteReel.toLocaleString()} F</div>
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

      {/* Section 4 : Frais et Remises */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Frais & Remises</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Remise globale (F CFA)</label>
            <input
              type="number"
              value={remiseGlobale}
              onChange={(e) => setRemiseGlobale(Number(e.target.value))}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Frais de livraison (F CFA)</label>
            <input
              type="number"
              value={fraisLivraison}
              onChange={(e) => setFraisLivraison(Number(e.target.value))}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-sengageSubText block mb-1">Frais supportés par :</label>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setFraisSupportesPar('client')}
              className={`flex-1 py-1.5 rounded-xl border transition-all ${
                fraisSupportesPar === 'client' 
                  ? 'bg-background border-sengageSubText/20 text-white font-bold' 
                  : 'bg-background/20 border-sengageSubText/5 text-sengageSubText'
              }`}
            >
              Le Client
            </button>
            <button
              type="button"
              onClick={() => setFraisSupportesPar('sengage')}
              className={`flex-1 py-1.5 rounded-xl border transition-all ${
                fraisSupportesPar === 'sengage' 
                  ? 'bg-background border-sengageSubText/20 text-white font-bold' 
                  : 'bg-background/20 border-sengageSubText/5 text-sengageSubText'
              }`}
            >
              SENGAGE
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-sengageSubText block mb-1">Observation</label>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white focus:outline-none h-16"
            placeholder="Notes complémentaires..."
          />
        </div>
      </div>

      {/* Section 5 : Règlement */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Règlement Acompte</h3>
        
        <div>
          <label className="text-[10px] text-sengageSubText block mb-1">Acompte payé à la commande (F CFA)</label>
          <input
            type="number"
            value={montantPaye}
            onChange={(e) => setMontantPaye(Number(e.target.value))}
            className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white focus:outline-none"
          />
        </div>

        {montantPaye > 0 && (
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Mode de règlement</label>
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
            <span className="text-sengageSubText">Total Articles :</span>
            <span className="text-white font-bold">{totalArticles.toLocaleString()} F CFA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sengageSubText">Total Commande :</span>
            <span className="text-white font-black text-sm">{totalCommande.toLocaleString()} F CFA</span>
          </div>
          <div className="flex justify-between border-t border-dashed border-sengageSubText/5 mt-1 pt-1">
            <span className="text-sengageSubText">Reste à payer :</span>
            <span className="text-sengageRed font-black text-sm">{reliquat.toLocaleString()} F CFA</span>
          </div>
        </div>
      </div>

      {/* Bouton de Validation */}
      <button
        type="submit"
        className="w-full py-3.5 bg-sengageGreen hover:bg-sengageGreen/80 text-background font-bold rounded-2xl shadow-xl transition-all active:scale-95 text-sm"
      >
        Enregistrer la Commande
      </button>
    </form>
  );
};
