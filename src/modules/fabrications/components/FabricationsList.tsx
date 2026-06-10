import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useAppStore } from '../../../store/useAppStore';
import { FabricationsService } from '../services/fabricationsService';
import { Plus, Search, Eye } from 'lucide-react';
import type { FabricationStatut } from '../../../types';

export const FabricationsList: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('Toutes');

  const listData = useLiveQuery(async () => {
    const list = await FabricationsService.getFabrications();
    const joined = [];

    for (const fab of list) {
      const menuisier = await db.contacts.get(fab.menuisierId);
      const totalCost = fab.lignes.reduce((sum, l) => sum + (l.quantite * l.coutUnitaireNegocie), 0) - fab.remise;
      
      joined.push({
        ...fab,
        menuisierNom: menuisier ? menuisier.nom : 'Menuisier inconnu',
        totalCost,
        reliquat: Math.max(0, totalCost - fab.avancePayee)
      });
    }

    return joined;
  }, []);

  const filters = [
    'Toutes',
    'Commandées',
    'En fabrication',
    'Terminées',
    'Reçues en stock',
    'Partiellement payées',
    'Payées'
  ];

  const handleFilterMatch = (fab: any) => {
    if (selectedFilter === 'Toutes') return true;
    if (selectedFilter === 'Commandées') return fab.statut === 'commandee';
    if (selectedFilter === 'En fabrication') return fab.statut === 'en_fabrication';
    if (selectedFilter === 'Terminées') return fab.statut === 'terminee';
    if (selectedFilter === 'Reçues en stock') return fab.statut === 'recue_en_stock';
    if (selectedFilter === 'Payées') return fab.statut === 'payee';
    if (selectedFilter === 'Partiellement payées') return fab.avancePayee > 0 && fab.reliquat > 0;
    return true;
  };

  const filtered = listData?.filter(fab => {
    const matchesSearch = fab.menuisierNom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          fab.numero.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && handleFilterMatch(fab);
  });

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
      case 'commandee': return 'bg-sengageSubText/10 text-sengageSubText/80';
      case 'en_fabrication': return 'bg-sengageOrange/10 text-sengageOrange border border-sengageOrange/20';
      case 'terminee': return 'bg-sengageGreen/10 text-sengageGreen border border-sengageGreen/20';
      case 'recue_en_stock': return 'bg-sengageGreen text-background font-semibold';
      case 'payee': return 'bg-sengageGreen/20 text-sengageGreen border border-sengageGreen/30';
      default: return 'bg-surface text-sengageSubText';
    }
  };

  const openDetail = (id: string) => {
    localStorage.setItem('active_fabrication_id', id);
    setActiveTab('detail_fabrication');
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-xs">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-sengageText">Fabrications Internes</h2>
        <button
          onClick={() => setActiveTab('nouvelle_fabrication')}
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
          placeholder="Rechercher un menuisier, modèle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-surface border border-sengageSubText/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-sengageSubText/45 focus:outline-none focus:border-sengageGreen"
        />
      </div>

      {/* Filtres */}
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

      {/* Liste */}
      <div className="flex flex-col gap-3">
        {filtered && filtered.length > 0 ? (
          filtered.map(fab => (
            <div key={fab.id} className="card-sengage flex flex-col gap-3 border border-sengageSubText/5">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white leading-tight">{fab.menuisierNom}</h4>
                  <span className="text-[10px] text-sengageSubText/60 font-semibold">{fab.numero}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold ${getStatutColor(fab.statut)}`}>
                  {getStatutLabel(fab.statut)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-sengageSubText/5 pt-2">
                <div>
                  <div className="text-[10px] text-sengageSubText">Coût Total</div>
                  <div className="font-bold text-white">{fab.totalCost.toLocaleString()} F CFA</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-sengageSubText">Avance payée</div>
                  <div className="font-bold text-sengageGreen">{fab.avancePayee.toLocaleString()} F CFA</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-dashed border-sengageSubText/5 pt-2 mt-1">
                <span className="text-[10px] text-sengageSubText/65">
                  Délai prévu : <strong className="text-white/80">{new Date(fab.datePrevue).toLocaleDateString('fr-FR')}</strong>
                </span>
                <button
                  onClick={() => openDetail(fab.id)}
                  className="flex items-center gap-1 text-xs text-sengageGreen font-bold hover:underline"
                >
                  <Eye className="h-4 w-4" />
                  <span>Détail</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-sengageSubText/50 text-sm">
            Aucun ordre de fabrication trouvé.
          </div>
        )}
      </div>
    </div>
  );
};
