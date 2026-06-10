import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useAppStore } from '../../../store/useAppStore';
import { Plus, Search, Eye } from 'lucide-react';
import type { CommandeStatut, Commande } from '../../../types';

export const CommandesList: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('Toutes');

  // Charger les commandes et joindre les clients et les totaux
  const listData = useLiveQuery(async () => {
    const list = await db.commandes.toArray();
    const joined = [];

    for (const cmd of list) {
      const client = await db.contacts.get(cmd.clientId);
      const lignes = await db.commandeLignes.where('commandeId').equals(cmd.id).toArray();
      const totalArticles = lignes.reduce((sum, l) => sum + (l.quantite * l.prixVenteReel), 0);
      const total = totalArticles - cmd.remiseGlobale + cmd.fraisLivraison;

      // Calculer le montant déjà payé
      const ops = await db.operationsFinancieres
        .where('referenceId').equals(cmd.id)
        .and(op => op.type === 'encaissement')
        .toArray();
      const paye = ops.reduce((sum, op) => sum + op.montant, 0);

      joined.push({
        ...cmd,
        clientNom: client ? client.nom : 'Client inconnu',
        total,
        paye,
        reliquat: Math.max(0, total - paye)
      });
    }

    return joined;
  }, []);

  const filters = [
    'Toutes',
    'En attente de stock',
    'Réservées',
    'À livrer',
    'Livrées',
    'Impayées',
    'Clôturées'
  ];

  const handleFilterMatch = (cmd: any) => {
    if (selectedFilter === 'Toutes') return true;
    if (selectedFilter === 'En attente de stock') return cmd.statutCommande === 'en_attente_stock';
    if (selectedFilter === 'Réservées') return cmd.statutCommande === 'reservee';
    if (selectedFilter === 'À livrer') return cmd.statutCommande === 'equipee';
    if (selectedFilter === 'Livrées') return cmd.statutCommande === 'livree';
    if (selectedFilter === 'Clôturées') return cmd.statutCommande === 'cloturee';
    if (selectedFilter === 'Impayées') return cmd.statutPaiement !== 'payee';
    return true;
  };

  const filteredCommandes = listData?.filter(cmd => {
    const matchesSearch = cmd.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cmd.numero.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && handleFilterMatch(cmd);
  });

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

  const getStatutColor = (s: CommandeStatut) => {
    switch (s) {
      case 'en_attente_stock': return 'bg-sengageRed/10 text-sengageRed border border-sengageRed/25';
      case 'reservee': return 'bg-sengageOrange/10 text-sengageOrange border border-sengageOrange/25';
      case 'equipee': return 'bg-sengageGreen/10 text-sengageGreen border border-sengageGreen/25';
      case 'livree': return 'bg-sengageGreen text-background font-semibold';
      case 'cloturee': return 'bg-sengageSubText/10 text-sengageSubText/70';
      default: return 'bg-surface text-sengageSubText border border-sengageSubText/10';
    }
  };

  // Naviguer vers les détails de la commande
  const openDetail = (id: string) => {
    // Utiliser un paramètre temporaire dans localStorage ou via Zustand.
    // Pour une V1 simple, on peut le stocker dans localStorage pour que DetailCommande le lise
    localStorage.setItem('active_commande_id', id);
    setActiveTab('detail_commande');
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Commandes Clients</h2>
        <button
          onClick={() => setActiveTab('nouvelle_commande')}
          className="p-2 bg-sengageGreen text-background hover:bg-sengageGreen/80 rounded-xl transition-all active:scale-95 flex items-center justify-center"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Barre de Recherche */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-sengageSubText/60" />
        <input
          type="text"
          placeholder="Rechercher un client ou commande..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-surface border border-sengageSubText/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-sengageSubText/45 focus:outline-none focus:border-sengageGreen"
        />
      </div>

      {/* Barre de Filtres défilants */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedFilter === filter
                ? 'bg-sengageGreen border-sengageGreen text-background font-bold'
                : 'bg-surface border-sengageSubText/5 text-sengageSubText/75 hover:border-sengageSubText/20'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Liste des commandes */}
      <div className="flex flex-col gap-3">
        {filteredCommandes && filteredCommandes.length > 0 ? (
          filteredCommandes.map(cmd => (
            <div key={cmd.id} className="card-sengage flex flex-col gap-3 relative border border-sengageSubText/5">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white leading-tight">{cmd.clientNom}</h4>
                  <span className="text-[10px] text-sengageSubText/60 font-semibold tracking-wider">{cmd.numero}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold ${getStatutColor(cmd.statutCommande)}`}>
                  {getStatutLabel(cmd.statutCommande)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-sengageSubText/5 pt-2">
                <div>
                  <div className="text-[10px] text-sengageSubText">Total Commande</div>
                  <div className="font-bold text-white">{cmd.total.toLocaleString('fr-FR')} F CFA</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-sengageSubText">Reste à payer</div>
                  <div className={`font-bold ${cmd.reliquat > 0 ? 'text-sengageRed' : 'text-sengageGreen'}`}>
                    {cmd.reliquat.toLocaleString('fr-FR')} F CFA
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-1 pt-2 border-t border-dashed border-sengageSubText/5">
                <span className="text-[10px] text-sengageSubText/60">
                  Livré à : <strong className="text-white/80">{cmd.lieuLivraison || 'Non spécifié'}</strong>
                </span>
                <button
                  onClick={() => openDetail(cmd.id)}
                  className="flex items-center gap-1.5 text-xs text-sengageGreen font-bold hover:underline"
                >
                  <Eye className="h-4 w-4" />
                  <span>Détail</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-sengageSubText/50 text-sm">
            Aucune commande trouvée.
          </div>
        )}
      </div>
    </div>
  );
};
