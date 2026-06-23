import React, { createContext, useContext, useState, useEffect } from 'react';
import { isBettingClosed } from '../utils/timeUtils';
import { BetRepository } from '../services/betting/repository';
import { BettingWalletService } from '../services/betting/wallet';
import { useAuth } from './AuthContext';
import type { Bet } from '../services/betting/types';

interface BetSlipContextType {
  bets: Bet[];
  addBet: (bet: Omit<Bet, 'id' | 'userId' | 'date' | 'status'>) => Promise<void>;
  removeBet: (id: string) => void;
  clearBets: () => void;
  updateStake: (id: string, stake: number) => void;
  hasBet: (matchId: string, type: '1' | 'X' | '2') => boolean;
  isSubmitting: boolean;
  error: string | null;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier et nettoyer les paris expirés
  useEffect(() => {
    const interval = setInterval(() => {
      setBets(prevBets => 
        prevBets.filter(bet => !isBettingClosed(bet.matchTime))
      );
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  const addBet = async (newBet: Omit<Bet, 'id' | 'userId' | 'date' | 'status'>) => {
    try {
      setError(null);
      setIsSubmitting(true);

      if (!currentUser) {
        throw new Error('Vous devez être connecté pour placer un pari');
      }

      if (isBettingClosed(newBet.matchTime)) {
        throw new Error('Les paris sont fermés pour ce match');
      }

      // Vérifier que la mise et la cote sont valides
      if (!newBet.odds || newBet.odds <= 0) {
        throw new Error('Cote invalide');
      }

      // Ajouter le pari au panier
      setBets(prev => {
        // Supprimer le pari existant s'il y en a un
        const filtered = prev.filter(bet => bet.id !== newBet.id);
        return [...filtered, { ...newBet, stake: 0 }];
      });

      setIsSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeBet = (id: string) => {
    setBets(prev => prev.filter(bet => bet.id !== id));
  };

  const clearBets = () => {
    setBets([]);
  };

  const updateStake = (id: string, stake: number) => {
    setBets(prev => prev.map(bet => 
      bet.id === id ? { ...bet, stake } : bet
    ));
  };

  const hasBet = (matchId: string, type: '1' | 'X' | '2') => {
    return bets.some(bet => bet.matchId === matchId && bet.type === type);
  };

  return (
    <BetSlipContext.Provider value={{ 
      bets, 
      addBet, 
      removeBet, 
      clearBets, 
      updateStake, 
      hasBet,
      isSubmitting,
      error
    }}>
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (context === undefined) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
}