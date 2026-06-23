import React, { useState, useEffect } from 'react';
import { StaffWalletService } from '../../../services/staff/wallet';
import BaseDashboard from '../BaseDashboard';
import { AlertCircle, Wallet, Search, Users } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import type { StaffWallet } from '../../../services/staff/types';
import LoadingState from '../../../components/LoadingState';
import { useAuth } from '../../../contexts/AuthContext';

export default function ManagerStaffWalletManagement() {
  const { userData } = useAuth();
  const [wallets, setWallets] = useState<StaffWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = userData?.role === 'adminuser';

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser la méthode mise à jour qui récupère déjà les informations utilisateur
      const data = await StaffWalletService.getAllStaffWallets();
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
      wallet.userId?.toLowerCase().includes(searchStr) ||
      wallet.balance.toString().includes(searchStr) ||
      wallet.currency.toLowerCase().includes(searchStr) ||
      (wallet.email?.toLowerCase() || '').includes(searchStr) ||
      (wallet.firstName?.toLowerCase() || '').includes(searchStr) ||
      (wallet.lastName?.toLowerCase() || '').includes(searchStr)
    );
  });

  if (loading) {
    return (
      <BaseDashboard title="Gestion des Portefeuilles Staff">
        <LoadingState message="Chargement des portefeuilles..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Gestion des Portefeuilles Staff">
      <div className="space-y-6">
        {/* En-tête avec statistiques - visible uniquement pour les admins */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Staff</p>
                  <p className="text-xl font-bold">{wallets.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Solde Total</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(wallets.reduce((sum, w) => sum + w.balance, 0), 'XAF')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Solde Moyen</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(
                      wallets.length > 0 
                        ? wallets.reduce((sum, w) => sum + w.balance, 0) / wallets.length 
                        : 0, 
                      'XAF'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, ID ou solde..."
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

        {/* Liste des staff */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Staff</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Nom</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
                          <span className="text-lg font-medium text-blue-600">
                            {wallet.firstName?.[0] || wallet.email?.[0]?.toUpperCase() || 'S'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Staff #{wallet.userId?.slice(0, 8)}
                          </div>
                          <div className="text-sm text-gray-500">ID: {wallet.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {wallet.firstName || wallet.lastName 
                          ? `${wallet.firstName || ''} ${wallet.lastName || ''}`.trim()
                          : 'Non renseigné'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {wallet.email || 'Email non disponible'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(wallet.balance, wallet.currency)}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredWallets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Aucun staff trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseDashboard>
  );
}