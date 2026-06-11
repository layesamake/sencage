import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { ContactsService } from '../services/contactsService';
import { Plus, User, Phone, MapPin, AlertTriangle, X, Edit2 } from 'lucide-react';
import type { ContactType } from '../../../types';

export const ContactsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContactType>('client');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [viewingContactId, setViewingContactId] = useState<string | null>(null);

  // Formulaire d'ajout
  const [nom, setNom] = useState('');
  const [tel, setTel] = useState('');
  const [adresse, setAdresse] = useState('');
  const [obs, setObs] = useState('');

  // Charger les contacts et calculer leurs statistiques en direct
  const contacts = useLiveQuery(async () => {
    const list = await ContactsService.getContactsByType(activeTab);
    const joined = [];

    for (const c of list) {
      let stats: any = {};
      if (c.type === 'client') {
        stats = await ContactsService.getClientStats(c.id);
      } else if (c.type === 'menuisier') {
        stats = await ContactsService.getMenuisierStats(c.id);
      } else {
        stats = await ContactsService.getFournisseurStats(c.id);
      }
      joined.push({
        ...c,
        stats
      });
    }

    return joined;
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !tel) return alert("Veuillez remplir le nom et le téléphone.");

    try {
      if (editingContactId) {
        await ContactsService.updateContact(editingContactId, {
          nom,
          telephone: tel,
          adresse,
          observation: obs
        });
        alert("Contact modifié.");
      } else {
        await ContactsService.addContact({
          nom,
          telephone: tel,
          adresse,
          type: activeTab,
          observation: obs
        });
        alert("Contact ajouté.");
      }

      setNom('');
      setTel('');
      setAdresse('');
      setObs('');
      setEditingContactId(null);
      setShowAddForm(false);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-xs">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-sengageText">Annuaire Contacts</h2>
        <button
          onClick={() => {
            setEditingContactId(null);
            setNom('');
            setTel('');
            setAdresse('');
            setObs('');
            setShowAddForm(true);
          }}
          className="p-2 bg-sengageGreen text-background hover:bg-sengageGreen/80 rounded-xl transition-all active:scale-95 flex items-center justify-center"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface rounded-2xl p-1 border border-sengageSubText/5">
        {['client', 'menuisier', 'fournisseur'].map((tab: any) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-center rounded-xl font-semibold capitalize transition-all ${
              activeTab === tab ? 'bg-background text-sengageGreen font-bold shadow-inner' : 'text-sengageSubText'
            }`}
          >
            {tab === 'client' ? 'Clients' : tab === 'menuisier' ? 'Menuisiers' : 'Fournisseurs'}
          </button>
        ))}
      </div>

      {/* Liste des contacts */}
      <div className="flex flex-col gap-3">
        {contacts && contacts.length > 0 ? (
          contacts.map(c => (
            <div 
              key={c.id} 
              onClick={() => setViewingContactId(c.id)}
              className="card-sengage cursor-pointer flex flex-col gap-3 border border-sengageSubText/5 hover:border-sengageGreen/30 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="bg-background p-2 rounded-xl border border-sengageSubText/5">
                    <User className="h-4.5 w-4.5 text-sengageSubText" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.nom}</h4>
                    <span className="text-[9px] text-sengageSubText/60 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{c.telephone}</span>
                    </span>
                  </div>
                </div>
                
                {c.type === 'client' && c.stats?.reliquatDu > 0 && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-sengageRed bg-sengageRed/10 border border-sengageRed/25 px-1.5 py-0.5 rounded-md">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Débiteur</span>
                  </span>
                )}
              </div>

              {c.adresse && (
                <div className="text-[10px] text-sengageSubText/80 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-sengageSubText/50" />
                  <span>{c.adresse}</span>
                </div>
              )}

              {/* Statistiques Métier */}
              <div className="border-t border-sengageSubText/5 pt-2.5 mt-1 grid grid-cols-3 gap-2 text-center text-[10px] text-sengageSubText">
                {c.type === 'client' && (
                  <>
                    <div>
                      <span>Commandes</span>
                      <div className="font-bold text-white mt-0.5">{c.stats?.commandesCount}</div>
                    </div>
                    <div className="border-x border-sengageSubText/5">
                      <span>Total Acheté</span>
                      <div className="font-bold text-white mt-0.5">{c.stats?.totalAchete?.toLocaleString()} F</div>
                    </div>
                    <div>
                      <span>Reliquat Dû</span>
                      <div className={`font-bold mt-0.5 ${c.stats?.reliquatDu > 0 ? 'text-sengageRed' : 'text-sengageGreen'}`}>
                        {c.stats?.reliquatDu?.toLocaleString()} F
                      </div>
                    </div>
                  </>
                )}

                {c.type === 'menuisier' && (
                  <>
                    <div>
                      <span>En cours</span>
                      <div className="font-bold text-white mt-0.5">{c.stats?.fabricationsEnCours}</div>
                    </div>
                    <div className="border-x border-sengageSubText/5">
                      <span>Commandé</span>
                      <div className="font-bold text-white mt-0.5">{c.stats?.totalCommandes?.toLocaleString()} F</div>
                    </div>
                    <div>
                      <span>Reliquat Dû</span>
                      <div className="font-bold text-sengageOrange mt-0.5">
                        {c.stats?.reliquatDu?.toLocaleString()} F
                      </div>
                    </div>
                  </>
                )}

                {c.type === 'fournisseur' && (
                  <>
                    <div className="col-span-2 text-left">
                      <span>Type de matériel fourni</span>
                      <div className="font-bold text-white mt-0.5">{c.observation || 'Non spécifié'}</div>
                    </div>
                    <div className="text-right">
                      <span>Achats</span>
                      <div className="font-bold text-white mt-0.5">{c.stats?.achatsCount}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-sengageSubText/50">
            Aucun contact trouvé dans cette catégorie.
          </div>
        )}
      </div>

      {/* Fiche Contact (Lecture Seule) */}
      {viewingContactId && (() => {
        const contact = contacts?.find(c => c.id === viewingContactId);
        if (!contact) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4 relative">
              <button 
                onClick={() => setViewingContactId(null)}
                className="absolute top-4 right-4 text-sengageSubText hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h3 className="font-black text-lg text-white border-b border-sengageSubText/5 pb-3 pr-8 capitalize">
                Fiche {contact.type}
              </h3>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-background p-3 rounded-xl border border-sengageSubText/5">
                    <User className="h-6 w-6 text-sengageSubText" />
                  </div>
                  <div>
                    <span className="text-[10px] text-sengageSubText block mb-0.5">Nom</span>
                    <div className="font-bold text-white text-base">{contact.nom}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-background p-3 rounded-xl border border-sengageSubText/5">
                  <div>
                    <span className="text-[10px] text-sengageSubText block mb-0.5">Téléphone</span>
                    <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-sengageSubText" />
                      {contact.telephone}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-sengageSubText block mb-0.5">Adresse</span>
                    <div className="font-semibold text-white text-sm flex items-center gap-1.5 truncate" title={contact.adresse}>
                      <MapPin className="h-3 w-3 text-sengageSubText" />
                      {contact.adresse || '-'}
                    </div>
                  </div>
                </div>

                {contact.observation && (
                  <div>
                    <span className="text-[10px] text-sengageSubText block mb-0.5">Observation / Note</span>
                    <div className="bg-background/50 border border-sengageSubText/5 p-2 rounded-xl text-sm text-sengageSubText">
                      {contact.observation}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-sengageSubText/5">
                <button
                  onClick={() => {
                    setViewingContactId(null);
                    setEditingContactId(contact.id);
                    setNom(contact.nom);
                    setTel(contact.telephone);
                    setAdresse(contact.adresse || '');
                    setObs(contact.observation || '');
                    setShowAddForm(true);
                  }}
                  className="flex-1 py-2.5 bg-sengageGreen/10 hover:bg-sengageGreen/20 text-sengageGreen font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Modifier le contact</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modale d'ajout/modification contact */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-surface max-w-sm w-full rounded-3xl p-6 border border-sengageSubText/10 shadow-2xl flex flex-col gap-4">
            <h3 className="font-black text-sm text-white border-b border-sengageSubText/5 pb-3">
              {editingContactId ? "Modifier le " : "Ajouter un "} 
              {activeTab === 'client' ? 'Client' : activeTab === 'menuisier' ? 'Menuisier' : 'Fournisseur'}
            </h3>
            
            <div>
              <label className="text-[10px] text-sengageSubText block mb-1">Nom Complet</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Samba Diop..."
                className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-sengageSubText block mb-1">Téléphone</label>
              <input
                type="tel"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="Ex: 77 123 45 67"
                className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-sengageSubText block mb-1">Adresse (Quartier, Ville)</label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex: Thiès, Grand Dakar..."
                className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-sengageSubText block mb-1">Observation / Note</label>
              <input
                type="text"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Observation..."
                className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-xs"
              >
                {editingContactId ? "Modifier" : "Ajouter"}
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
        </div>
      )}
    </div>
  );
};
