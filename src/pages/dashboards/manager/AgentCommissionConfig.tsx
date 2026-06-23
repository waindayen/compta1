import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import BaseDashboard from '../BaseDashboard';
import { AlertCircle, Search, Trophy, ToggleLeft, ToggleRight, Wallet } from 'lucide-react';
import LoadingState from '../../../components/LoadingState';
import { formatCurrency } from '../../../utils/format';

interface AgentUser {
  id: string;
  email: string;
  role: string;
  canConvertCommission: boolean;
  firstName?: string;
  lastName?: string;
}

interface AgentCommissionWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

interface AgentMainWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export default function AgentCommissionConfig() {
  const [agentUsers, setAgentUsers] = useState<AgentUser[]>([]);
  const [commissionWallets, setCommissionWallets] = useState<Record<string, AgentCommissionWallet>>({});
  const [mainWallets, setMainWallets] = useState<Record<string, AgentMainWallet>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    loadAgentUsers();
  }, []);

  const loadAgentUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer tous les utilisateurs agents
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'agentuser'));
      const querySnapshot = await getDocs(q);
      
      const users: AgentUser[] = [];
      const walletPromises: Promise<void>[] = [];
      const wallets: Record<string, AgentCommissionWallet> = {};
      const mainWalletsData: Record<string, AgentMainWallet> = {};

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          email: userData.email || 'Email non disponible',
          role: userData.role || 'agentuser',
          canConvertCommission: userData.canConvertCommission !== false, // true par défaut
          firstName: userData.firstName || '',
          lastName: userData.lastName || ''
        });

        // Récupérer le portefeuille de commission pour chaque agent
        const walletPromise = Promise.all([
          getCommissionWallet(doc.id),
          getMainWallet(doc.id)
        ]).then(([commissionWallet, mainWallet]) => {
          if (commissionWallet) {
            wallets[doc.id] = commissionWallet;
          }
          if (mainWallet) {
            mainWalletsData[doc.id] = mainWallet;
          }
        });
        walletPromises.push(walletPromise);
      });

      // Attendre que tous les portefeuilles soient récupérés
      await Promise.all(walletPromises);
      
      setAgentUsers(users);
      setCommissionWallets(wallets);
      setMainWallets(mainWalletsData);
    } catch (err) {
      console.error('Error loading agent users:', err);
      setError('Erreur lors du chargement des utilisateurs agents');
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

  const getMainWallet = async (userId: string): Promise<AgentMainWallet | null> => {
    try {
      const walletSnap = await getDocs(query(collection(db, 'agent_wallets'), where('userId', '==', userId)));
      
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
      console.error('Error getting main wallet:', error);
      return null;
    }
  };

  const toggleCommissionConversion = async (userId: string, canConvert: boolean) => {
    try {
      setUpdatingUser(userId);
      
      // Mettre à jour le document utilisateur
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        canConvertCommission: canConvert
      });

      // Mettre à jour l'état local
      setAgentUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, canConvertCommission: canConvert } 
            : user
        )
      );
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Erreur lors de la mise à jour des permissions');
    } finally {
      setUpdatingUser(null);
    }
  };

  const filteredAgents = agentUsers.filter(agent => 
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.firstName && agent.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.lastName && agent.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <BaseDashboard title="Gestion des Conversions de Commission Agent">
        <LoadingState message="Chargement des utilisateurs agents..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Gestion des Conversions de Commission Agent">
      <div className="space-y-6">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un agent par nom ou email..."
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
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Solde Principal</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Solde Commission</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Aucun agent trouvé
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
                            <span className="text-lg font-medium text-blue-600">
                              {agent.email[0]?.toUpperCase() || 'A'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {agent.firstName && agent.lastName 
                                ? `${agent.firstName} ${agent.lastName}`
                                : agent.email}
                            </div>
                            <div className="text-sm text-gray-500">{agent.email}</div>
                            <div className="text-sm text-gray-500">ID: {agent.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">
                            {mainWallets[agent.id] 
                              ? formatCurrency(mainWallets[agent.id].balance, mainWallets[agent.id].currency)
                              : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                          <span className="font-medium">
                            {commissionWallets[agent.id] 
                              ? formatCurrency(commissionWallets[agent.id].balance, commissionWallets[agent.id].currency)
                              : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleCommissionConversion(agent.id, !agent.canConvertCommission)}
                          disabled={updatingUser === agent.id}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            agent.canConvertCommission
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } ${updatingUser === agent.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {agent.canConvertCommission ? (
                            <>
                              <ToggleRight className="w-5 h-5" />
                              <span>Activée</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5" />
                              <span>Désactivée</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseDashboard>
  );
}