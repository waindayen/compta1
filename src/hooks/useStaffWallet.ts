import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StaffWalletService } from '../services/staff/wallet';
import type { StaffWallet, StaffCommissionWallet, StaffTransaction } from '../services/staff/types';

export function useStaffWallet() {
  const { currentUser, userData } = useAuth();
  const [wallet, setWallet] = useState<StaffWallet | null>(null);
  const [commissionWallet, setCommissionWallet] = useState<StaffCommissionWallet | null>(null);
  const [transactions, setTransactions] = useState<StaffTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || userData?.role !== 'staffuser') {
      setLoading(false);
      return;
    }

    const loadWalletData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les deux portefeuilles en parallèle
        const [mainWallet, commWallet] = await Promise.all([
          StaffWalletService.getWallet(currentUser.uid),
          StaffWalletService.getCommissionWallet(currentUser.uid)
        ]);

        // Si aucun portefeuille n'existe, les créer
        if (!mainWallet || !commWallet) {
          await StaffWalletService.createWalletIfNotExists(currentUser.uid, currentUser.email || '');
          const [newMainWallet, newCommWallet] = await Promise.all([
            StaffWalletService.getWallet(currentUser.uid),
            StaffWalletService.getCommissionWallet(currentUser.uid)
          ]);
          setWallet(newMainWallet);
          setCommissionWallet(newCommWallet);
        } else {
          setWallet(mainWallet);
          setCommissionWallet(commWallet);
        }

        // Ne plus charger les transactions automatiquement
        setTransactions([]);

      } catch (err) {
        console.error('Error loading wallet:', err);
        setError('Erreur lors du chargement du portefeuille');
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();
  }, [currentUser, userData]);

  return { 
    wallet, 
    commissionWallet,
    transactions, 
    loading, 
    error 
  };
}