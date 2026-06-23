import React, { useState, useEffect } from 'react';
import { AgentWalletService } from '../../../services/agent/wallet';
import BaseDashboard from '../BaseDashboard';
import { AlertCircle, Search } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import type { AgentWalletWithUserInfo } from '../../../services/agent/types';
import LoadingState from '../../../components/LoadingState';

export default function ManagerAgentWalletManagement() {
  const [wallets, setWallets] = useState<AgentWalletWithUserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AgentWalletService.getAllAgentWallets();
      setWallets(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des portefeuilles';
      setError(errorMessage);
      console.error('Error loading wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWallets = wallets.filter(wallet => {
    const searchStr = searchTerm.toLowerCase();
    return (
      wallet.userEmail?.toLowerCase().includes(searchStr) ||
      (wallet.userId ?? '').toString().toLowerCase().includes(searchStr) ||
      (wallet.balance ?? 0).toString().includes(searchStr) ||
      (wallet.currency ?? '').toLowerCase().includes(searchStr) ||
      (wallet.firstName?.toLowerCase() || '').includes(searchStr) ||
      (wallet.lastName?.toLowerCase() || '').includes(searchStr)
    );
  });

  // Toujours limiter à 3 lignes pour tous les écrans
  const displayedWallets = filteredWallets.slice(0, 3);

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

        {/* Liste des agents - Version mobile */}
        <div className="md:hidden">
          {filteredWallets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
              Aucun agent trouvé
            </div>
          ) : (
            <div className="space-y-4">
              {displayedWallets.map((wallet) => (
                <div key={wallet.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
                      <span className="text-lg font-medium text-blue-600">
                        {wallet.userEmail?.[0]?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {wallet.userEmail || 'Email non disponible'}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {wallet.firstName && wallet.lastName 
                          ? `${wallet.firstName} ${wallet.lastName}`
                          : wallet.firstName || wallet.lastName || 'Nom non renseigné'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {wallet.userId?.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Solde:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(wallet.balance, wallet.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Liste des agents - Version desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Agent</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Nom</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWallets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Aucun agent trouvé
                    </td>
                  </tr>
                ) : (
                  displayedWallets.map((wallet) => (
                    <tr key={wallet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
                            <span className="text-lg font-medium text-blue-600">
                              {wallet.userEmail?.[0]?.toUpperCase() || 'A'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              Agent #{wallet.userId?.slice(0, 8)}
                            </div>
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
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {wallet.userEmail || 'Email non disponible'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(wallet.balance, wallet.currency)}
                        </div>
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