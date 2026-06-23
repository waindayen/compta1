import React, { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';
import { useAgentWallet } from '../../hooks/useAgentWallet';

import { ServerTimeService } from '../../services/serverTime';

interface LottoGridProps {
  numbersToSelect: number;
  onSubmit: (selectedNumbers: number[]) => Promise<string>;
  disabled?: boolean;
  ticketPrice: number;
}

export default function LottoGrid({ numbersToSelect, onSubmit, disabled = false, ticketPrice }: LottoGridProps) {
  const { currentUser, userData } = useAuth();
  const { wallet } = useAgentWallet();
  const navigate = useNavigate();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Mettre à jour l'heure affichée toutes les secondes
  useEffect(() => {
    const updateTime = () => {
      const serverTime = new Date(ServerTimeService.getServerTimeISO());
      setCurrentTime(serverTime.toLocaleString('fr-FR', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNumberClick = useCallback((number: number) => {
    if (disabled || isSubmitting) return;
    
    setError(null);
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      }
      
      if (prev.length >= numbersToSelect) {
        setError(`Vous ne pouvez sélectionner que ${numbersToSelect} numéros`);
        return prev;
      }
      
      return [...prev, number];
    });
  }, [numbersToSelect, disabled, isSubmitting]);

  const handleFlash = useCallback(() => {
    if (disabled || isSubmitting) return;
    
    setError(null);
    const numbers = Array.from({ length: 50 }, (_, i) => i + 1);
    const flashNumbers: number[] = [];

    for (let i = 0; i < numbersToSelect; i++) {
      const randomIndex = Math.floor(Math.random() * numbers.length);
      flashNumbers.push(...numbers.splice(randomIndex, 1));
    }

    setSelectedNumbers(flashNumbers);
  }, [numbersToSelect, disabled, isSubmitting]);

  const handleValidate = async () => {
    try {
      if (disabled || isSubmitting) return;
      
      setError(null);
      setIsSubmitting(true);

      if (selectedNumbers.length !== numbersToSelect) {
        throw new Error(`Veuillez sélectionner exactement ${numbersToSelect} numéros`);
      }

      if (!currentUser) {
        throw new Error('Vous devez être connecté pour participer');
      }

      // Vérifier si l'utilisateur est un agent
      if (userData?.role !== 'agentuser') {
        throw new Error('Seuls les agents peuvent soumettre des tickets');
      }

      // Vérifier le solde de l'agent
      if (!wallet) {
        throw new Error('Portefeuille non trouvé');
      }

      if (wallet.balance < ticketPrice) {
        setError(`Solde insuffisant. Le ticket coûte ${formatCurrency(ticketPrice)}`);
        return;
      }

      // Soumettre la participation et obtenir l'ID du ticket
      const ticketId = await onSubmit(selectedNumbers);

      // Le modal de ticket sera affiché par le composant parent

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sélections actuelles */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="text-lg font-medium mb-3">Vos sélections</h3>
        <div className="flex flex-wrap gap-2">
          {selectedNumbers.length === 0 ? (
            <p className="text-gray-500">Aucun numéro sélectionné</p>
          ) : (
            selectedNumbers.map((num, index) => (
              <div key={`${num}-${index}`} className="relative">
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center z-10">
                  {index + 1}
                </span>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">
                  {num}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Prix du ticket - visible uniquement sur desktop */}
      <div className="hidden sm:block bg-blue-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-blue-800">Prix du ticket</span>
          <span className="font-bold text-blue-800">{formatCurrency(ticketPrice)}</span>
        </div>
        {wallet && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-blue-800">Solde disponible</span>
            <span className="font-bold text-blue-800">{formatCurrency(wallet.balance)}</span>
          </div>
        )}
        <div className="flex justify-between items-center mt-2">
          <span className="text-blue-800">Heure serveur (UTC)</span>
          <span className="font-mono text-sm text-blue-800">{currentTime}</span>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Grille de sélection */}
      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
        {Array.from({ length: 50 }, (_, i) => i + 1).map(number => {
          const isSelected = selectedNumbers.includes(number);
          const selectionIndex = selectedNumbers.indexOf(number);
          
          return (
            <button
              key={number}
              onClick={() => handleNumberClick(number)}
              disabled={disabled || isSubmitting}
              className={`
                relative w-full aspect-square rounded-lg flex items-center justify-center text-lg font-medium
                transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                ${isSelected 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }
              `}
            >
              {number}
              {isSelected && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                  {selectionIndex + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Boutons d'action - Fixés en bas sur mobile */}
      <div className="sticky bottom-0 bg-white pt-4 pb-4 border-t border-gray-200 mt-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={handleFlash}
            disabled={disabled || isSubmitting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            Flash
          </button>
          
          <button
            onClick={handleValidate}
            disabled={disabled || isSubmitting || selectedNumbers.length !== numbersToSelect}
            className={`
              flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform
              ${selectedNumbers.length === numbersToSelect && !disabled && !isSubmitting
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? 'Validation...' : 'Valider la grille'}
            {selectedNumbers.length > 0 && (
              <span className="ml-2">
                ({selectedNumbers.length}/{numbersToSelect})
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}