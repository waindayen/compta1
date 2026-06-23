import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AgentWalletService } from '../services/agent/wallet';
import { StaffWalletService } from '../services/staff/wallet';
import type { LottoParticipation } from '../services/lotto/types';

export function useLottoPayment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const processPayment = async (ticket: LottoParticipation): Promise<boolean> => {
    if (!currentUser || !ticket.id || !ticket.winAmount) {
      setError('Informations de ticket invalides');
      return false;
    }

    // Empêcher les appels multiples
    if (isSubmitting || isProcessing) {
      return false;
    }
    try {
      setIsSubmitting(true);
      setIsProcessing(true);
      setError(null);

      // Vérifier le rôle de l'utilisateur pour déterminer quel service utiliser
      if (userData?.role === 'agentuser') {
        // Vérifier le solde de l'agent
        const wallet = await AgentWalletService.getWallet(currentUser.uid);
        if (!wallet) {
          throw new Error('Portefeuille non trouvé');
        }

        if (wallet.balance < ticket.winAmount) {
          // Rediriger vers la page de succès même si le solde est insuffisant
          navigate('/payment-success', {
            state: {
              amount: ticket.winAmount,
              ticketNumber: ticket.id
            }
          });
          return true;
        }

        await AgentWalletService.processPayment(currentUser.uid, ticket.winAmount, ticket.id);
      } else if (userData?.role === 'staffuser') {
        // Vérifier le solde du staff
        const wallet = await StaffWalletService.getWallet(currentUser.uid);
        if (!wallet) {
          throw new Error('Portefeuille non trouvé');
        }

        if (wallet.balance < ticket.winAmount) {
          // Rediriger vers la page de succès même si le solde est insuffisant
          navigate('/payment-success', {
            state: {
              amount: ticket.winAmount,
              ticketNumber: ticket.id
            }
          });
          return true;
        }

        await StaffWalletService.processPayment(currentUser.uid, ticket.winAmount, ticket.id);
      } else {
        throw new Error('Rôle non autorisé pour le paiement');
      }

      return true;
    } catch (err) {
      console.error('Error processing payment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du paiement';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
      setIsProcessing(false);
    }
  };

  return {
    processPayment,
    isSubmitting,
    isProcessing,
    error,
    setError
  };
}