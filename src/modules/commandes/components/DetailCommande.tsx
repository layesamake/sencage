import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useAppStore } from '../../../store/useAppStore';
import { CommandesService } from '../services/commandesService';
import { RapportsService } from '../../rapports/services/rapportsService';
import { PdfService } from '../../../services/pdfService';
import { ArrowLeft, User, Phone, MapPin, Tag, Truck, Calendar, FileText, CheckCircle } from 'lucide-react';
import type { CommandeStatut, PaiementStatut } from '../../../types';

export const DetailCommande: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const [paiementMontant, setPaiementMontant] = useState<number>(0);
  const [paiementCompte, setPaiementCompte] = useState<'caisse' | 'wave' | 'orange_money'>('caisse');
  const [showPaiementForm, setShowPaiementForm] = useState(false);

  // Charger l'ID stocké dans localStorage
  const commandeId = localStorage.getItem('active_commande_id');

  const data = useLiveQuery(async () => {
    if (!commandeId) return null;

    const cmd = await CommandesService.getCommandeById(commandeId);
    if (!cmd) return null;

    const client = await db.contacts.get(cmd.clientId);
    const linesJoined = [];

    for (const l of cmd.lignes) {
      let articleNom = 'Inconnu';
      if (l.produitType === 'cage' && l.cageModeleId) {
        const c = await db.cagesModeles.get(l.cageModeleId);
        articleNom = c ? `${c.nom} (${c.espece})` : 'Cage';
      } else if (l.produitType === 'accessoire' && l.accessoireId) {
        const a = await db.accessoires.get(l.accessoireId);
        articleNom = a ? a.nom : 'Accessoire';
      }

      linesJoined.push({
        ...l,
        articleNom
      });
    }

    const totalArticles = cmd.lignes.reduce((sum, l) => sum + (l.quantite * l.prixVenteReel), 0);
    const totalCommande = totalArticles - cmd.remiseGlobale + cmd.fraisLivraison;

    // Charger les paiements financiers effectués
    const operations = await db.operationsFinancieres
      .where('referenceId').equals(commandeId)
      .and(op => op.type === 'encaissement')
      .toArray();
    const totalPaye = operations.reduce((sum, op) => sum + op.montant, 0);

    // Calcul de la marge estimée en direct
    const marge = await RapportsService.calculateMargeCommande(commandeId);

    return {
      commande: cmd,
      client,
      lignes: linesJoined,
      totalCommande,
      totalPaye,
      reliquat: Math.max(0, totalCommande - totalPaye),
      operations,
      marge
    };
  }, [commandeId]);

  if (!data) return <div className="text-center py-12 text-sengageSubText">Chargement...</div>;

  const { commande, client, lignes, totalCommande, totalPaye, reliquat, operations, marge } = data;

  const getStatutLabel = (s: CommandeStatut) => {
    switch (s) {
      case 'brouillon': return 'Brouillon';
      case 'confirmee': return 'Confirmée';
      case 'en_attente_stock': return 'Attente Stock';
      case 'reservee': return 'Réservée';
      case 'equipee': return 'Équipée';
      case 'livree': return 'Livrée';
      case 'cloturee': return 'Clôturée';
    }
  };

  const getPaiementLabel = (p: PaiementStatut) => {
    switch (p) {
      case 'non_payee': return 'Non payée';
      case 'partiellement_payee': return 'Partiellement';
      case 'payee': return 'Réglée';
    }
  };

  const getPaiementColor = (p: PaiementStatut) => {
    switch (p) {
      case 'payee': return 'bg-sengageGreen/10 text-sengageGreen border-sengageGreen/20';
      case 'partiellement_payee': return 'bg-sengageOrange/10 text-sengageOrange border-sengageOrange/20';
      default: return 'bg-sengageRed/10 text-sengageRed border-sengageRed/20';
    }
  };

  // Actions
  const handleReserver = async () => {
    const ok = await CommandesService.tenterReservationStock(commande.id);
    if (ok) {
      alert("Réservation effectuée avec succès.");
    } else {
      alert("Le stock disponible est toujours insuffisant pour réserver cette commande.");
    }
  };

  const handleMarquerEquipee = async () => {
    await CommandesService.marquerEquipee(commande.id);
    alert("Commande marquée comme équipée (accessoires montés).");
  };

  const handleLivrer = async () => {
    const livreur = prompt("Entrez le nom du livreur :");
    if (!livreur) return;
    const lieu = prompt("Confirmez le lieu de livraison :", commande.lieuLivraison || '');
    if (!lieu) return;

    try {
      await CommandesService.livrerCommande(commande.id, livreur, lieu);
      alert("Livraison validée.");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleCloturer = async () => {
    await CommandesService.cloturerCommande(commande.id);
    alert("Commande clôturée définitivement.");
  };

  const handleAddPaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paiementMontant <= 0) return alert("Montant incorrect.");

    try {
      await CommandesService.addPaiement(commande.id, paiementMontant, paiementCompte);
      alert("Paiement enregistré.");
      setPaiementMontant(0);
      setShowPaiementForm(false);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const downloadPDF = async (docType: 'facture' | 'recu' | 'livraison') => {
    let blob;
    if (docType === 'facture') blob = await PdfService.generateFacture(commande.id);
    else if (docType === 'recu') blob = await PdfService.generateRecu(commande.id);
    else blob = await PdfService.generateBonLivraison(commande.id);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType}-${commande.numero}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-xs">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setActiveTab('commandes')}
          className="p-2 bg-surface hover:bg-surface/80 rounded-xl text-sengageSubText"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-bold text-sengageText">Détail Commande</h2>
      </div>

      {/* Fiche Client et Statuts */}
      <div className="card-sengage flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-sengageSubText/5 pb-2">
          <span className="text-sm font-bold text-white">{commande.numero}</span>
          <div className="flex gap-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-surface border border-sengageSubText/10">
              {getStatutLabel(commande.statutCommande)}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${getPaiementColor(commande.statutPaiement)}`}>
              {getPaiementLabel(commande.statutPaiement)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sengageText">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-sengageGreen" />
            <span className="font-bold text-white">{client?.nom || 'Client inconnu'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-sengageSubText/75" />
            <span>{client?.telephone || 'Aucun numéro'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-sengageSubText/75" />
            <span>{commande.lieuLivraison || 'Non spécifié'}</span>
          </div>
        </div>
      </div>

      {/* Lignes de commande */}
      <div className="card-sengage flex flex-col gap-2">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Articles</h3>
        <div className="flex flex-col gap-2">
          {lignes.map((l: any) => (
            <div key={l.id} className="flex justify-between items-center py-1">
              <div>
                <div className="font-bold text-white">{l.articleNom}</div>
                <div className="text-[10px] text-sengageSubText">{l.quantite} x {l.prixVenteReel.toLocaleString()} F</div>
              </div>
              <span className="font-bold text-white">{(l.quantite * l.prixVenteReel).toLocaleString()} F</span>
            </div>
          ))}

          <div className="border-t border-sengageSubText/5 pt-2 flex flex-col gap-1 text-[11px] text-sengageSubText">
            <div className="flex justify-between">
              <span>Remise globale :</span>
              <span className="text-sengageOrange">-{commande.remiseGlobale.toLocaleString()} F CFA</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison ({commande.fraisSupportesPar === 'client' ? 'Dû par Client' : 'Offert par SENGAGE'}) :</span>
              <span>{commande.fraisLivraison.toLocaleString()} F CFA</span>
            </div>
            <div className="flex justify-between text-white font-black text-sm border-t border-dashed border-sengageSubText/5 pt-1.5 mt-0.5">
              <span>Total Commande :</span>
              <span>{totalCommande.toLocaleString()} F CFA</span>
            </div>
            <div className="flex justify-between text-sengageGreen font-bold border-t border-sengageSubText/5 pt-1">
              <span>Marge nette estimée :</span>
              <span>{marge.toLocaleString()} F CFA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Actions</h3>
        
        <div className="grid grid-cols-2 gap-2">
          {/* S'il faut réserver du stock */}
          {(commande.statutCommande === 'confirmee' || commande.statutCommande === 'en_attente_stock') && (
            <button
              onClick={handleReserver}
              className="py-2.5 bg-sengageOrange text-white font-bold rounded-xl active:scale-95 transition-all text-center"
            >
              Réserver le stock
            </button>
          )}

          {/* S'il faut équiper */}
          {commande.statutCommande === 'reservee' && (
            <button
              onClick={handleMarquerEquipee}
              className="py-2.5 bg-sengageOrange text-white font-bold rounded-xl active:scale-95 transition-all text-center"
            >
              Équiper la commande
            </button>
          )}

          {/* S'il faut livrer */}
          {(commande.statutCommande === 'equipee' || commande.statutCommande === 'reservee') && (
            <button
              onClick={handleLivrer}
              className="py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-center col-span-2 text-xs"
            >
              Déclencher la Livraison
            </button>
          )}

          {/* S'il faut clôturer */}
          {commande.statutCommande === 'livree' && (
            <button
              onClick={handleCloturer}
              className="py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-center col-span-2 text-xs"
            >
              Clôturer la commande
            </button>
          )}

          <button
            onClick={() => setShowPaiementForm(true)}
            className="py-2.5 bg-surface border border-sengageSubText/20 text-white font-bold rounded-xl active:scale-95 transition-all text-center"
          >
            Ajouter Paiement
          </button>
        </div>

        {/* Formulaire ajout paiement */}
        {showPaiementForm && (
          <form onSubmit={handleAddPaiement} className="border-t border-sengageSubText/5 pt-3 mt-1 flex flex-col gap-2">
            <div>
              <label className="text-[10px] text-sengageSubText block mb-1">Montant Encaissé (F CFA)</label>
              <input
                type="number"
                value={paiementMontant}
                onChange={(e) => setPaiementMontant(Number(e.target.value))}
                className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-sengageSubText block mb-1">Mode de paiement</label>
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
                Enregistrer
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

      {/* Zone Documents */}
      <div className="card-sengage flex flex-col gap-2">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Documents (PDF)</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => downloadPDF('facture')}
            className="flex items-center justify-between p-2.5 bg-background/40 hover:bg-background/80 rounded-xl border border-sengageSubText/5 text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-sengageRed" />
              <span className="font-semibold text-white">Facture Simple</span>
            </div>
            <span className="text-[10px] text-sengageGreen font-bold">Générer</span>
          </button>
          
          <button
            onClick={() => downloadPDF('recu')}
            className="flex items-center justify-between p-2.5 bg-background/40 hover:bg-background/80 rounded-xl border border-sengageSubText/5 text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-sengageRed" />
              <span className="font-semibold text-white">Reçu de Paiement</span>
            </div>
            <span className="text-[10px] text-sengageGreen font-bold">Générer</span>
          </button>

          <button
            onClick={() => downloadPDF('livraison')}
            className="flex items-center justify-between p-2.5 bg-background/40 hover:bg-background/80 rounded-xl border border-sengageSubText/5 text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-sengageRed" />
              <span className="font-semibold text-white">Bon de Livraison</span>
            </div>
            <span className="text-[10px] text-sengageGreen font-bold">Générer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
