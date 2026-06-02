import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Delete, ShieldCheck } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { pinCode, setPinCode, unlock } = useAuthStore();
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState(false);
  const [isSettingMode, setIsSettingMode] = useState(!pinCode);
  const [tempPin, setTempPin] = useState('');

  const handleKeyPress = (num: string) => {
    setError(false);
    if (inputPin.length < 4) {
      const nextPin = inputPin + num;
      setInputPin(nextPin);

      if (nextPin.length === 4) {
        // Validation automatique si le code fait 4 chiffres
        if (isSettingMode) {
          if (!tempPin) {
            setTempPin(nextPin);
            setInputPin('');
            alert("Veuillez ressaisir le code pour confirmer.");
          } else {
            if (tempPin === nextPin) {
              setPinCode(nextPin);
              setIsSettingMode(false);
              unlock(nextPin);
            } else {
              alert("Les codes ne correspondent pas. Recommencez.");
              setTempPin('');
              setInputPin('');
            }
          }
        } else {
          const success = unlock(nextPin);
          if (!success) {
            setError(true);
            setInputPin('');
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setInputPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col justify-between min-h-screen bg-background text-sengageText p-6 max-w-md mx-auto">
      {/* En-tête */}
      <div className="flex flex-col items-center mt-12">
        <div className="bg-surface p-4 rounded-full border border-sengageSubText/10 shadow-lg mb-4">
          <Lock className={`h-8 w-8 ${error ? 'text-sengageRed animate-bounce' : 'text-sengageGreen'}`} />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">SENGAGE Manager</h1>
        <p className="text-sengageSubText text-sm mt-1">
          {isSettingMode 
            ? (!tempPin ? "Configurez votre code PIN à 4 chiffres" : "Confirmez votre code PIN")
            : "Vos données de gestion sont protégées"}
        </p>
      </div>

      {/* Visualiseur PIN */}
      <div className="flex flex-col items-center my-8">
        <div className="flex gap-4">
          {[0, 1, 2, 3].map(index => (
            <div
              key={index}
              className={`h-5 w-5 rounded-full border-2 ${
                error 
                  ? 'border-sengageRed bg-sengageRed/20' 
                  : index < inputPin.length 
                    ? 'border-sengageGreen bg-sengageGreen' 
                    : 'border-sengageSubText/30 bg-transparent'
              } transition-all duration-150`}
            />
          ))}
        </div>
        {error && (
          <p className="text-sengageRed text-xs mt-3 font-semibold">Code PIN incorrect</p>
        )}
      </div>

      {/* Clavier */}
      <div className="bg-surface rounded-3xl p-6 border border-sengageSubText/5 shadow-2xl mb-8">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-16 text-2xl font-bold text-white bg-background/40 hover:bg-background/80 rounded-2xl transition-all active:scale-95 flex items-center justify-center border border-sengageSubText/5"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={() => setInputPin('')}
            className="h-16 text-sm font-semibold text-sengageSubText bg-transparent hover:bg-background/20 rounded-2xl transition-all active:scale-95 flex items-center justify-center"
          >
            Effacer
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 text-2xl font-bold text-white bg-background/40 hover:bg-background/80 rounded-2xl transition-all active:scale-95 flex items-center justify-center border border-sengageSubText/5"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-16 text-sengageSubText bg-transparent hover:bg-background/20 rounded-2xl transition-all active:scale-95 flex items-center justify-center"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>

        <div className="flex justify-center mt-4">
          <button 
            onClick={() => alert("Pour réinitialiser le code, veuillez désinstaller l'application ou vider le stockage local.")}
            className="text-xs text-sengageOrange font-semibold hover:underline"
          >
            Code oublié ?
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 mb-4 text-xs text-sengageSubText/60">
        <ShieldCheck className="h-4 w-4 text-sengageGreen/60" />
        <span>SENGAGE Manager V1 — Chiffrement Local</span>
      </div>
    </div>
  );
};
