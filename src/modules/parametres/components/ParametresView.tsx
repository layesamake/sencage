import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useAppStore } from '../../../store/useAppStore';
import { SyncService } from '../../../services/syncService';
import { LocalBackupService } from '../../../services/localBackupService';
import { 
  Building, 
  Lock, 
  CloudLightning, 
  Settings, 
  Check, 
  RefreshCw,
  Download,
  Upload,
  Database
} from 'lucide-react';

export const ParametresView: React.FC = () => {
  const { pinCode, setPinCode } = useAuthStore();
  const { isOffline, setSyncing, isSyncing } = useAppStore();

  const [commercialName, setCommercialName] = useState('SENCAILLE');
  const [phone, setPhone] = useState('76 864 58 34');
  const [adresse, setAdresse] = useState('Quartier MBambara, Thiès');
  const [description, setDescription] = useState('Fabrication et vente de cages d’élevage et accessoires');

  const [newPin, setNewPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  const handleSaveIdentity = () => {
    alert("Identité commerciale enregistrée localement.");
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      return alert("Le code PIN doit comporter exactement 4 chiffres.");
    }
    setPinCode(newPin);
    setNewPin('');
    setShowPinInput(false);
    alert("Code PIN modifié avec succès.");
  };

  const handleSyncCloud = async () => {
    if (isOffline) {
      return alert("Synchronisation impossible en mode hors ligne.");
    }

    setSyncing(true);
    try {
      const res = await SyncService.syncAll();
      alert(res.message);
    } catch (err) {
      alert("Erreur de synchronisation : " + (err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-xs">
      <h2 className="text-xl font-bold text-sengageText">Paramètres Généraux</h2>

      {/* Identité Commerciale */}
      <div className="card-sengage flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-sengageSubText/5 pb-2 text-white font-bold">
          <Building className="h-4.5 w-4.5 text-sengageGreen" />
          <span>Identité Commerciale</span>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Nom Commercial</label>
            <input
              type="text"
              value={commercialName}
              onChange={(e) => setCommercialName(e.target.value)}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Téléphone / WhatsApp</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Adresse Siège</label>
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-sengageSubText block mb-1">Mention légale PDF</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-white"
            />
          </div>
          <button
            onClick={handleSaveIdentity}
            className="w-full py-2 bg-sengageGreen/10 border border-sengageGreen/20 hover:bg-sengageGreen/20 text-sengageGreen font-bold rounded-xl active:scale-95 transition-all"
          >
            Enregistrer les informations
          </button>
        </div>
      </div>

      {/* Sécurité */}
      <div className="card-sengage flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-sengageSubText/5 pb-2 text-white font-bold">
          <Lock className="h-4.5 w-4.5 text-sengageOrange" />
          <span>Sécurité d'Accès</span>
        </div>

        <div className="flex justify-between items-center text-sengageText py-1">
          <div>
            <span className="font-semibold block">Code PIN Activé</span>
            <span className="text-[10px] text-sengageSubText">Protège vos données locales de gestion</span>
          </div>
          <span className="bg-sengageGreen/10 border border-sengageGreen/25 text-sengageGreen font-bold px-2 py-0.5 rounded-lg text-[10px]">
            Actif
          </span>
        </div>

        <button
          onClick={() => setShowPinInput(!showPinInput)}
          className="w-full py-2 bg-surface hover:bg-background border border-sengageSubText/10 text-white font-bold rounded-xl active:scale-95 transition-all"
        >
          {showPinInput ? "Annuler la modification" : "Modifier le code PIN"}
        </button>

        {showPinInput && (
          <form onSubmit={handleUpdatePin} className="flex gap-2 items-center border-t border-sengageSubText/5 pt-3">
            <input
              type="password"
              maxLength={4}
              placeholder="Nouveau PIN (4 chiffres)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="bg-background border border-sengageSubText/10 rounded-xl p-2.5 text-center font-bold tracking-widest text-white w-full"
            />
            <button
              type="submit"
              className="p-2.5 bg-sengageGreen text-background hover:bg-sengageGreen/85 rounded-xl font-bold active:scale-95"
            >
              <Check className="h-5 w-5" />
            </button>
          </form>
        )}
      </div>

      {/* Sauvegarde & Synchro Cloud */}
      <div className="card-sengage flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-sengageSubText/5 pb-2 text-white font-bold">
          <CloudLightning className="h-4.5 w-4.5 text-sengageGreen" />
          <span>Sauvegarde & Cloud</span>
        </div>

        <div className="flex justify-between items-center text-sengageText py-1">
          <div>
            <span className="font-semibold block">Statut Connexion Cloud</span>
            <span className="text-[10px] text-sengageSubText">Supabase Sync Service</span>
          </div>
          <span className={`font-bold px-2 py-0.5 rounded-lg text-[10px] ${isOffline ? 'bg-sengageRed/10 border border-sengageRed/25 text-sengageRed' : 'bg-sengageGreen/10 border border-sengageGreen/25 text-sengageGreen'}`}>
            {isOffline ? 'Déconnecté' : 'Connecté'}
          </span>
        </div>

        <button
          onClick={handleSyncCloud}
          disabled={isSyncing || isOffline}
          className="w-full py-2.5 bg-sengageGreen text-background font-black rounded-xl active:scale-95 transition-all text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Synchronisation en cours...</span>
            </>
          ) : (
            <span>Sauvegarder / Synchroniser maintenant</span>
          )}
        </button>
      </div>

      {/* Sauvegarde & Restauration Locale */}
      <div className="card-sengage flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-sengageSubText/5 pb-2 text-white font-bold">
          <Database className="h-4.5 w-4.5 text-sengageGreen" />
          <span>Gestion des Données Locales (Backup)</span>
        </div>

        <p className="text-[10px] text-sengageSubText leading-normal">
          Sauvegardez vos données localement sur votre appareil sous forme de fichier de sauvegarde JSON ou restaurez une sauvegarde précédente.
        </p>

        <div className="flex gap-2.5 mt-1">
          {/* Exporter */}
          <button
            onClick={async () => {
              try {
                await LocalBackupService.exportBackup();
              } catch (err) {
                alert("Erreur lors de l'exportation : " + (err as Error).message);
              }
            }}
            className="flex-1 py-2.5 bg-sengageGreen/10 border border-sengageGreen/20 hover:bg-sengageGreen/20 text-sengageGreen font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>

          {/* Importer */}
          <label className="flex-1 py-2.5 bg-surface hover:bg-background border border-sengageSubText/10 text-white font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none">
            <Upload className="h-4 w-4 text-sengageOrange" />
            <span>Importer</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const confirmRestore = confirm(
                  "⚠️ ATTENTION : Restaurer ces données va ÉCRASER l'intégralité de vos données locales actuelles (cages, commandes, stocks, finances). Cette action est irréversible. Voulez-vous continuer ?"
                );
                
                if (!confirmRestore) {
                  e.target.value = '';
                  return;
                }

                try {
                  const res = await LocalBackupService.importBackup(file);
                  alert(res.message);
                  if (res.success) {
                    window.location.reload();
                  }
                } catch (err) {
                  alert("Erreur critique : " + (err as Error).message);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Préférences */}
      <div className="card-sengage flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-sengageSubText/5 pb-2 text-white font-bold">
          <Settings className="h-4.5 w-4.5 text-sengageSubText" />
          <span>Préférences Système</span>
        </div>

        <div className="flex justify-between items-center text-sengageText py-1">
          <span>Devise principale</span>
          <span className="font-bold text-white">FCFA / XOF</span>
        </div>

        <div className="flex justify-between items-center text-sengageText py-1 border-t border-sengageSubText/5 pt-2">
          <span>Thème de l'interface</span>
          <span className="font-bold text-white">Sombre (Bleuté)</span>
        </div>
      </div>
    </div>
  );
};
