import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useAppStore } from '../../../store/useAppStore';
import { FabricationsService } from '../services/fabricationsService';
import { ArrowLeft, User, Phone, Calendar, Clipboard, AlertTriangle } from 'lucide-react';
import type { FabricationStatut } from '../../../types';

export const DetailFabrication: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const [paiementMontant, setPaiementMontant] = useState(0);
  const [paiementCompte, setPaiementCompte] = useState<'caisse' | 'wave' | 'orange_money'>('caisse');
  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fabricationId = localStorage.getItem('active_fabrication_id');

  const data = useLiveQuery(async () => {
    if (!fabricationId) return null;

    const fab = await FabricationsService.getFabricationById(fabricationId);
    if (!fab) return null;

    const menuisier = await db.contacts.get(fab.menuisierId);
    const linesJoined = [];

    for (const l of fab.lignes) {
      const c = await db.cagesModeles.get(l.cageModeleId);
      linesJoined.push({
        ...l,
        cageNom: c ? c.nom : 'Cage'
      });
    }

    const totalCost = fab.lignes.reduce((sum, l) => sum + (l.quantite * l.coutUnitaireNegocie), 0) - fab.remise;
    const reliquat = Math.max(0, totalCost - fab.avancePayee);

    // Charger les décaissements associés à cette fabrication
    const operations = await db.operationsFinancieres
      .where('referenceId').equals(fabricationId)
      .and(op => op.type === 'decaissement')
      .toArray();

    return {
      fabrication: fab,
      menuisier,
      lignes: linesJoined,
      totalCost,
      reliquat,
      operations
    };
  }, [fabricationId]);

  if (!data) return <div className="text-center py-12 text-sengageSubText">Chargement...</div>;

  const { fabrication, menuisier, lignes, totalCost, reliquat, operations } = data;

  const getStatutLabel = (s: FabricationStatut) => {
    switch (s) {
      case 'commandee': return 'Commandée';
      case 'en_fabrication': return 'En fabrication';
      case 'terminee': return 'Terminée';
      case 'recue_en_stock': return 'Reçue en stock';
      case 'payee': return 'Payée';
    }
  };

  const getStatutColor = (s: FabricationStatut) => {
    switch (s) {
      case 'recue_en_stock': return 'bg-sengageGreen text-background font-bold';
      case 'terminee': return 'bg-sengageGreen/10 text-sengageGreen border-sengageGreen/20';
      case 'en_fabrication': return 'bg-sengageOrange/10 text-sengageOrange border-sengageOrange/20';
      default: return 'bg-surface text-sengageSubText border border-sengageSubText/10';
    }
  };

  const handleUpdateStatut = async (statut: FabricationStatut) => {
    try {
      await FabricationsService.updateStatut(fabrication.id, statut);
      alert(`Commande mise à jour : ${getStatutLabel(statut)}`);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleConfirmReceipt = async () => {
    try {
      await FabricationsService.updateStatut(fabrication.id, 'recue_en_stock');
      setShowConfirmModal(false);
      alert("Entrée en stock effectuée avec succès.");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddPaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paiementMontant <= 0) return alert("Montant incorrect.");

    try {
      await FabricationsService.addPaiement(fabrication.id, paiementMontant, paiementCompte);
      alert("Paiement enregistré.");
      setPaiementMontant(0);
      setShowPaiementForm(false);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-xs relative">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setActiveTab('fabrications')}
          className="p-2 bg-surface hover:bg-surface/80 rounded-xl text-sengageSubText"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-bold text-white">Détail Fabrication</h2>
      </div>

      {/* Menuisier et Statut */}
      <div className="card-sengage flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-sengageSubText/5 pb-2">
          <span className="text-sm font-bold text-white">{fabrication.numero}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${getStatutColor(fabrication.statut)}`}>
            {getStatutLabel(fabrication.statut)}
          </span>
        </div>

        <div className="flex flex-col gap-2 text-sengageText">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-sengageGreen" />
            <span className="font-bold text-white">{menuisier?.nom || 'Menuisier inconnu'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-sengageSubText/75" />
            <span>{menuisier?.telephone || 'Aucun numéro'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sengageSubText/75" />
            <span>Prévue le : {new Date(fabrication.datePrevue).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* Cages à fabriquer */}
      <div className="card-sengage flex flex-col gap-2">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Modèles Commandés</h3>
        <div className="flex flex-col gap-2">
          {lignes.map((l: any) => (
            <div key={l.id} className="flex justify-between items-center py-1">
              <div>
                <div className="font-bold text-white">{l.cageNom}</div>
                <div className="text-[10px] text-sengageSubText">{l.quantite} unité(s) x {l.coutUnitaireNegocie.toLocaleString()} F</div>
              </div>
              <span className="font-bold text-white">{(l.quantite * l.coutUnitaireNegocie).toLocaleString()} F</span>
            </div>
          ))}

          <div className="border-t border-sengageSubText/5 pt-2 flex flex-col gap-1 text-[11px] text-sengageSubText">
            {fabrication.remise > 0 && (
              <div className="flex justify-between">
                <span>Remise obtenue :</span>
                <span className="text-sengageGreen">-{fabrication.remise.toLocaleString()} F CFA</span>
              </div>
            )}
            <div className="flex justify-between text-white font-black text-sm border-t border-dashed border-sengageSubText/5 pt-1.5 mt-0.5">
              <span>Coût Total :</span>
              <span>{totalCost.toLocaleString()} F CFA</span>
            </div>
            <div className="flex justify-between">
              <span>Avance réglée :</span>
              <span className="text-sengageGreen">{fabrication.avancePayee.toLocaleString()} F CFA</span>
            </div>
            <div className="flex justify-between text-sengageOrange font-bold mt-0.5 pt-1 border-t border-sengageSubText/5">
              <span>Reste dû au menuisier :</span>
              <span>{reliquat.toLocaleString()} F CFA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Suivi Fabrication</h3>
        <div className="grid grid-cols-2 gap-2">
          {fabrication.statut === 'commandee' && (
            <button
              onClick={() => handleUpdateStatut('en_fabrication')}
              className="py-2.5 bg-sengageOrange/15 border border-sengageOrange/30 text-sengageOrange font-bold rounded-xl active:scale-95 transition-all text-center"
            >
              Lancer la fabrication
            </button>
          )}

          {fabrication.statut === 'en_fabrication' && (
            <button
              onClick={() => handleUpdateStatut('terminee')}
              className="py-2.5 bg-sengageGreen/15 border border-sengageGreen/30 text-sengageGreen font-bold rounded-xl active:scale-95 transition-all text-center col-span-2"
            >
              Marquer comme terminée
            </button>
          )}

          {/* Réceptionner en stock (exige confirmation) */}
          {(fabrication.statut === 'terminee' || fabrication.statut === 'commandee' || fabrication.statut === 'en_fabrication') && (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-center col-span-2"
            >
              Réceptionner en stock SENGAGE
            </button>
          )}

          {reliquat > 0 && (
            <button
              onClick={() => setShowPaiementForm(true)}
              className="py-2.5 bg-surface border border-sengageSubText/20 text-white font-bold rounded-xl active:scale-95 transition-all text-center col-span-2"
            >
              Régler le Solde / Acompte
            </button>
          )}
        </div>

        {/* Formulaire paiement reliquat */}
        {showPaiementForm && (
          <form onSubmit={handleAddPaiement} className="border-t border-sengageSubText/5 pt-3 mt-1 flex flex-col gap-2">
            <div>
              <label className="text-[10px] text-sengageSubText block mb-1">Montant Décassé (F CFA) - Max {reliquat.toLocaleString()} F</label>
              <input
                type="number"
                value={paiementMontant}
                onChange={(e) => setPaiementMontant(Number(e.target.value))}
                className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-sengageSubText block mb-1">Mode de règlement</label>
              <select
                value={paiementCompte}
                onChange={(e: any) => setPaiementCompte(e.target.value)}
                className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white focus:outline-none"
              >
                <option value="caisse">Espèces (Caisse)</option>
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
              </select>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-sengageGreen text-background font-bold rounded-xl active:scale-95"
              >
                Confirmer le Paiement
              </button>
              <button
                type="button"
                onClick={() => setShowPaiementForm(false)}
                className="flex-1 py-2 bg-surface text-sengageSubText rounded-xl active:scale-95"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Historique des acomptes */}
      {operations.length > 0 && (
        <div className="card-sengage flex flex-col gap-2">
          <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Historique des versements</h3>
          <div className="flex flex-col gap-2">
            {operations.map(op => (
              <div key={op.id} className="flex justify-between items-center text-xs py-1 border-b border-sengageSubText/5 last:border-0">
                <div>
                  <span className="font-semibold text-white capitalize">{op.compteSource}</span>
                  <span className="text-[10px] text-sengageSubText block">{new Date(op.dateOperation).toLocaleDateString('fr-FR')}</span>
                </div>
                <span className="font-bold text-sengageRed">-{op.montant.toLocaleString()} F</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modale de Confirmation d'entrée en stock */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sengageOrange border-b border-sengageSubText/5 pb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-black text-sm text-white">Entrée en stock</h3>
            </div>
            <p className="text-sengageText text-xs leading-relaxed">
              Cette action va ajouter définitivement les cages commandées de la fabrication <strong>{fabrication.numero}</strong> au stock disponible SENGAGE.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleConfirmReceipt}
                className="flex-1 py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-xs"
              >
                Confirmer l'entrée
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-background text-sengageSubText rounded-xl border border-sengageSubText/10 active:scale-95 transition-all text-xs"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
