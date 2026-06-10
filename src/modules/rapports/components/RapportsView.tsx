import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { RapportsService } from '../services/rapportsService';
import { PdfService } from '../../../services/pdfService';
import { FileText, Award, Calendar, TrendingUp, Users, Package } from 'lucide-react';

export const RapportsView: React.FC = () => {
  const data = useLiveQuery(async () => {
    const now = new Date();
    // 1. Calcul rentabilité mensuelle
    const { ventes, marge, depensesDiverses } = await RapportsService.calculateMargeMensuelle(
      now.getMonth(),
      now.getFullYear()
    );

    // 2. Clients débiteurs
    const debiteurs = await RapportsService.getClientsDebiteurs();
    const totalDebiteurs = debiteurs.reduce((sum, d) => sum + d.reliquatTotal, 0);

    // 3. Montant dû aux menuisiers
    const fabrications = await db.fabrications.toArray();
    let totalDuMenuisiers = 0;
    for (const fab of fabrications) {
      const lignes = await db.fabricationLignes.where('fabricationId').equals(fab.id).toArray();
      const totalCost = lignes.reduce((sum, l) => sum + (l.quantite * l.coutUnitaireNegocie), 0) - fab.remise;
      totalDuMenuisiers += Math.max(0, totalCost - fab.avancePayee);
    }

    // 4. Commandes clients en attente de stock
    const cmdAttente = await db.commandes.filter(c => c.statutCommande === 'en_attente_stock').toArray();

    // 5. Fabrications en cours chez les menuisiers
    const fabEnCours = await db.fabrications.filter(f => f.statut === 'en_fabrication' || f.statut === 'commandee').toArray();

    // 6. Cages les plus vendues (Calcul à partir des lignes de commande livrées/clôturées)
    const cmdLivrées = await db.commandes
      .filter(c => c.statutCommande === 'livree' || c.statutCommande === 'cloturee')
      .toArray();

    const productSalesMap: { [key: string]: { nom: string; qty: number } } = {};
    for (const cmd of cmdLivrées) {
      const lignes = await db.commandeLignes.where('commandeId').equals(cmd.id).toArray();
      for (const l of lignes) {
        let name = 'Article';
        let key = '';
        if (l.produitType === 'cage' && l.cageModeleId) {
          key = `cage-${l.cageModeleId}`;
          const c = await db.cagesModeles.get(l.cageModeleId);
          name = c ? `${c.nom} (${c.espece})` : 'Cage';
        } else if (l.produitType === 'accessoire' && l.accessoireId) {
          key = `acc-${l.accessoireId}`;
          const a = await db.accessoires.get(l.accessoireId);
          name = a ? a.nom : 'Accessoire';
        }

        if (key) {
          if (!productSalesMap[key]) {
            productSalesMap[key] = { nom: name, qty: 0 };
          }
          productSalesMap[key].qty += l.quantite;
        }
      }
    }

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      ventes,
      marge,
      depensesDiverses,
      totalDebiteurs,
      debiteursCount: debiteurs.length,
      totalDuMenuisiers,
      cmdAttenteCount: cmdAttente.length,
      fabEnCoursCount: fabEnCours.length,
      topProducts
    };
  }, []);

  const downloadPDF = async (docType: 'rapport' | 'stock' | 'debiteurs') => {
    let blob;
    if (docType === 'rapport') blob = await PdfService.generateRapportMensuel(new Date());
    else if (docType === 'stock') blob = await PdfService.generateEtatStock();
    else blob = await PdfService.generateClientsDebiteurs();

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType}-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFCFA = (val?: number) => {
    if (val === undefined) return '0 F CFA';
    return `${val.toLocaleString('fr-FR')} F CFA`;
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-xs">
      <h2 className="text-xl font-bold text-white">Rapports & Rentabilité</h2>

      {/* Téléchargements PDF */}
      <div className="card-sengage flex flex-col gap-2">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Exports PDF Officiels</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => downloadPDF('rapport')}
            className="flex items-center justify-between p-2.5 bg-background/40 hover:bg-background/80 rounded-xl border border-sengageSubText/5 text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-sengageRed" />
              <span className="font-semibold text-white">Rapport Mensuel d'Activité</span>
            </div>
            <span className="text-[10px] text-sengageGreen font-bold">Télécharger</span>
          </button>
          
          <button
            onClick={() => downloadPDF('stock')}
            className="flex items-center justify-between p-2.5 bg-background/40 hover:bg-background/80 rounded-xl border border-sengageSubText/5 text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-sengageRed" />
              <span className="font-semibold text-white">État Global du Stock</span>
            </div>
            <span className="text-[10px] text-sengageGreen font-bold">Télécharger</span>
          </button>

          <button
            onClick={() => downloadPDF('debiteurs')}
            className="flex items-center justify-between p-2.5 bg-background/40 hover:bg-background/80 rounded-xl border border-sengageSubText/5 text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-sengageRed" />
              <span className="font-semibold text-white">Liste des Clients Débiteurs</span>
            </div>
            <span className="text-[10px] text-sengageGreen font-bold">Télécharger</span>
          </button>
        </div>
      </div>

      {/* Rentabilité et Indicateurs clés */}
      <div className="card-sengage flex flex-col gap-3">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Indicateurs de Performance</h3>
        
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-sengageGreen" />
              <span className="text-sengageText">Ventes brutes (mois)</span>
            </div>
            <span className="font-bold text-white">{formatFCFA(data?.ventes)}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-t border-sengageSubText/5 pt-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-sengageGreen" />
              <span className="text-sengageText">Marge Mensuelle Nette</span>
            </div>
            <span className="font-black text-sengageGreen">{formatFCFA(data?.marge)}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-t border-sengageSubText/5 pt-2">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-sengageRed" />
              <span className="text-sengageText">Crédits Clients (Dû)</span>
            </div>
            <span className="font-bold text-sengageRed">{formatFCFA(data?.totalDebiteurs)}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-t border-sengageSubText/5 pt-2">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-sengageOrange" />
              <span className="text-sengageText">Dettes Menuisiers (Reliquat)</span>
            </div>
            <span className="font-bold text-sengageOrange">{formatFCFA(data?.totalDuMenuisiers)}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-t border-sengageSubText/5 pt-2">
            <div className="flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-sengageOrange" />
              <span className="text-sengageText">Commandes en attente de stock</span>
            </div>
            <span className="font-bold text-white">{data?.cmdAttenteCount || 0}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-t border-sengageSubText/5 pt-2">
            <div className="flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-sengageSubText" />
              <span className="text-sengageText">Fabrications en cours</span>
            </div>
            <span className="font-bold text-white">{data?.fabEnCoursCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Top Produits */}
      <div className="card-sengage flex flex-col gap-2">
        <h3 className="font-bold text-white border-b border-sengageSubText/5 pb-2">Produits les plus vendus</h3>
        <div className="flex flex-col gap-2">
          {data?.topProducts && data.topProducts.length > 0 ? (
            data.topProducts.map((p, index) => (
              <div key={index} className="flex justify-between items-center py-1 border-b border-sengageSubText/5 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="bg-background text-sengageGreen font-bold px-2 py-0.5 rounded-lg border border-sengageSubText/5">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-white">{p.nom}</span>
                </div>
                <span className="font-bold text-white">{p.qty} unité(s)</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-sengageSubText/50">
              Aucune vente enregistrée pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
