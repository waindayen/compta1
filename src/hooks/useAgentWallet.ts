import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AgentWalletService } from '../services/agent/wallet';
import type { AgentWallet, AgentCommissionWallet, AgentTransaction } from '../services/agent/types';

export function useAgentWallet() {
  const { currentUser, userData } = useAuth();
  const [wallet, setWallet] = useState<AgentWallet | null>(null);
  const [commissionWallet, setCommissionWallet] = useState<AgentCommissionWallet | null>(null);
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || userData?.role !== 'agentuser') {
      setLoading(false);
      return;
    }

    const loadWalletData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les portefeuilles et transactions en parallèle
        const [mainWallet, commWallet] = await Promise.all([
          AgentWalletService.getWallet(currentUser.uid),
          AgentWalletService.getCommissionWallet(currentUser.uid)
        ]);

        // Si aucun portefeuille n'existe, les créer
        if (!mainWallet || !commWallet) {
          await AgentWalletService.createWalletIfNotExists(currentUser.uid, currentUser.email || '');
          const [newMainWallet, newCommWallet] = await Promise.all([
            AgentWalletService.getWallet(currentUser.uid),
            AgentWalletService.getCommissionWallet(currentUser.uid)
          ]);
          setWallet(newMainWallet);
          setCommissionWallet(newCommWallet);
          setTransactions([]);
          setHasMoreTransactions(false);
        } else {
          setWallet(mainWallet);
          setCommissionWallet(commWallet);
          setTransactions([]);
          setHasMoreTransactions(false);
        }

      } catch (err) {
        console.error('Error loading wallet:', err);
        setError('Erreur lors du chargement du portefeuille');
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();
  }, [currentUser, userData]);

  const loadMoreTransactions = async () => {
    if (!currentUser || loadingMoreTransactions || !hasMoreTransactions) return;

    try {
      setLoadingMoreTransactions(true);
      setError(null);

      // Récupérer plus de transactions en commençant après les transactions actuelles
      const moreTransactions = await AgentWalletService.getTransactions(
        currentUser.uid, 
        10, // Charger 10 de plus
        transactions.length // Offset
      );

      if (moreTransactions.length > 0) {
        setTransactions(prev => [...prev, ...moreTransactions]);
        setHasMoreTransactions(moreTransactions.length >= 10);
      } else {
        setHasMoreTransactions(false);
      }
    } catch (err) {
      console.error('Error loading more transactions:', err);
      setError('Erreur lors du chargement des transactions supplémentaires');
    } finally {
      setLoadingMoreTransactions(false);
    }
  };
  return { 
    wallet, 
    commissionWallet, 
    transactions,
    hasMoreTransactions,
    loadingMoreTransactions,
    loadMoreTransactions,
    loading, 
    error
  };
}