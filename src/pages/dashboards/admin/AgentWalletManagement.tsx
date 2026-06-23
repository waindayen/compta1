import React, { useState, useEffect } from 'react';
import { AgentWalletService } from '../../../services/agent/wallet';
import BaseDashboard from '../BaseDashboard';
import { AlertCircle, Wallet, Search, Trophy } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import type { AgentWalletWithUserInfo } from '../../../services/agent/types';
import LoadingState from '../../../components/LoadingState';
import { useAuth } from '../../../contexts/AuthContext';
import CreditWalletModal from '../../../components/admin/wallet/CreditWalletModal';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface AgentCommissionWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export default function AgentWalletManagement() {
  const { currentUser } = useAuth();
  const [wallets, setWallets] = useState<AgentWalletWithUserInfo[]>([]);
  const [commissionWallets, setCommissionWallets] = useState<Record<string, AgentCommissionWallet>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<AgentWalletWithUserInfo | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AgentWalletService.getAllAgentWallets();
      setWallets(data);
      
      // Charger les portefeuilles de commission pour chaque agent
      const commissionWalletsData: Record<string, AgentCommissionWallet> = {};
      const walletPromises = data.map(async (wallet) => {
        try {
          const commissionWallet = await getCommissionWallet(wallet.userId);
          if (commissionWallet) {
            commissionWalletsData[wallet.userId] = commissionWallet;
          }
        } catch (err) {
          console.error(`Error loading commission wallet for ${wallet.userId}:`, err);
        }
      });
      
      await Promise.all(walletPromises);
      setCommissionWallets(commissionWalletsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des portefeuilles';
      setError(errorMessage);
      console.error('Error loading wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCommissionWallet = async (userId: string): Promise<AgentCommissionWallet | null> => {
    try {
      const walletSnap = await getDocs(query(collection(db, 'agent_commission_wallets'), where('userId', '==', userId)));
      
      if (walletSnap.empty) {
        return null;
      }
      
      const walletDoc = walletSnap.docs[0];
      return {
        id: walletDoc.id,
        userId,
        balance: walletDoc.data().balance || 0,
        currency: walletDoc.data().currency || 'XAF'
      };
    } catch (error) {
      console.error('Error getting commission wallet:', error);
      return null;
    }
  };

  const handleCredit = (wallet: AgentWalletWithUserInfo) => {
    setSelectedWallet(wallet);
    setShowCreditModal(true);
  };

  const handleCreditSubmit = async (amount: number) => {
    if (!selectedWallet || !currentUser) return;
    
    try {
      await AgentWalletService.creditWallet(
        selectedWallet.id, 
        amount, 
        currentUser.uid, 
        currentUser.email || undefined
      );
      await loadWallets();
      setShowCreditModal(false);
      setSelectedWallet(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du crédit';
      setError(errorMessage);
    }
  };

  const filteredWallets = wallets.filter(wallet => {
    const searchStr = searchTerm.toLowerCase();
    return (
      wallet.userEmail?.toLowerCase().includes(searchStr) ||
      (wallet.userId ?? '').toLowerCase().includes(searchStr) ||
      wallet.balance.toString().includes(searchStr) ||
      wallet.currency.toLowerCase().includes(searchStr) ||
      (wallet.firstName?.toLowerCase() || '').includes(searchStr) ||
      (wallet.lastName?.toLowerCase() || '').includes(searchStr)
    );
  });

  if (loading) {
    return (
      <BaseDashboard title="Gestion des Portefeuilles Agents">
        <LoadingState message="Chargement des portefeuilles..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Gestion des Portefeuilles Agents">
      <div className="space-y-6">
        {/* Statistiques globales */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-xl font-bold">{wallets.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Solde Principal Total</p>
                <p className="text-xl font-bold">
                  {formatCurrency(wallets.reduce((sum, w) => sum + w.balance, 0), 'XAF')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Commission Totale</p>
                <p className="text-xl font-bold">
                  {formatCurrency(
                    Object.values(commissionWallets).reduce((sum, w) => sum + w.balance, 0), 
                    'XAF'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par email, ID, solde ou devise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Liste des agents */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Agent</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Nom</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Solde Principal</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Solde Commission</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Valeur unitaire</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Dernière mise à jour</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <Wallet className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">Agent #{wallet.userId ? wallet.userId.slice(0, 8) : 'N/A'}</div>
                          <div className="text-sm text-gray-500">ID: {wallet.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {wallet.firstName && wallet.lastName 
                          ? `${wallet.firstName} ${wallet.lastName}`
                          : wallet.firstName || wallet.lastName || 'Non renseigné'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{wallet.userEmail}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-medium">
                        {formatCurrency(wallet.balance, wallet.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-medium">
                        {commissionWallets[wallet.userId] 
                          ? formatCurrency(commissionWallets[wallet.userId].balance, commissionWallets[wallet.userId].currency)
                          : formatCurrency(0, 'XAF')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {wallet.unitValue}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(wallet.updatedAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleCredit(wallet)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Créditer
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredWallets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Aucun agent trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de crédit */}
      {selectedWallet && showCreditModal && (
        <CreditWalletModal
          isOpen={showCreditModal}
          onClose={() => {
            setShowCreditModal(false);
            setSelectedWallet(null);
          }}
          wallet={selectedWallet}
          onSubmit={handleCreditSubmit}
        />
      )}
    </BaseDashboard>
  );
}