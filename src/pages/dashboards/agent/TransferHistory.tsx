import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Download, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Send } from 'lucide-react';
import BaseDashboard from '../BaseDashboard';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { formatCurrency } from '../../../utils/format';
import LoadingState from '../../../components/LoadingState';
import TransferHistoryNav from '../../../components/agent/transfer/TransferHistoryNav';

interface TransferTransaction {
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  currency: string;
  referenceType: string;
  status: string;
  createdAt: string;
  transferTo?: string;
  transferFrom?: string;
  transferAmount?: number;
  feeAmount?: number;
  counterpartyEmail?: string;
  counterpartyName?: string;
  direction: 'envoi' | 'reception';
}

interface TransferFilters {
  startDate: string;
  endDate: string;
  direction: 'all' | 'envoi' | 'reception';
  status: 'all' | 'completed' | 'pending' | 'failed';
}

export default function AgentTransferHistory() {
  const { currentUser } = useAuth();
  const [transfers, setTransfers] = useState<TransferTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TransferFilters>({
    startDate: '',
    endDate: '',
    direction: 'all',
    status: 'all'
  });

  // Ne plus charger automatiquement au montage du composant

  const loadTransferHistory = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Récupérer toutes les transactions de l'agent (sans filtre de date dans la requête)
      const transactionsRef = collection(db, 'agent_transactions');
      const q = query(
        transactionsRef,
        where('walletId', '==', currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const transferData: TransferTransaction[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Filtrer côté client pour les transferts uniquement
        if (!['staff_transfer', 'agent_transfer'].includes(data.referenceType)) {
          continue;
        }
        
        // Appliquer les filtres de date côté client
        if (filters.startDate || filters.endDate) {
          const transactionDate = new Date(data.createdAt);
          if (filters.startDate && transactionDate < new Date(filters.startDate)) continue;
          if (filters.endDate && transactionDate > new Date(filters.endDate + 'T23:59:59')) continue;
        }
        
        // Déterminer la direction du transfert
        let direction: 'envoi' | 'reception';
        
        if (data.type === 'debit' && data.transferTo) {
          direction = 'envoi'; // L'agent envoie de l'argent
        } else if (data.type === 'credit' && data.transferFrom) {
          direction = 'reception'; // L'agent reçoit de l'argent
        } else {
          continue; // Ignorer les transactions qui ne sont pas des transferts clairs
        }

        // Récupérer les informations de la contrepartie
        let counterpartyInfo = null;
        const counterpartyId = data.transferTo || data.transferFrom;
        if (counterpartyId) {
          try {
            const userRef = doc(db, 'users', counterpartyId);
            const userSnapshot = await getDoc(userRef);
            
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              counterpartyInfo = {
                email: userData.email || 'Email non disponible',
                name: userData.firstName && userData.lastName 
                  ? `${userData.firstName} ${userData.lastName}`
                  : userData.firstName || userData.lastName || 'Nom non disponible'
              };
            }
          } catch (err) {
            console.error('Error fetching counterparty info:', err);
          }
        }

        transferData.push({
          id: doc.id,
          type: data.type,
          amount: data.amount || 0,
          currency: data.currency || 'XAF',
          referenceType: data.referenceType,
          status: data.status || 'completed',
          createdAt: data.createdAt,
          transferTo: data.transferTo,
          transferFrom: data.transferFrom,
          transferAmount: data.transferAmount,
          feeAmount: data.feeAmount,
          counterpartyEmail: counterpartyInfo?.email,
          counterpartyName: counterpartyInfo?.name,
          direction
        });
      }

      // Trier par date décroissante côté client
      transferData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTransfers(transferData);
    } catch (err) {
      console.error('Error loading transfer history:', err);
      setError('Erreur lors du chargement de l\'historique des transferts');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransfers = () => {
    let filtered = [...transfers];

    // Filtre par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(transfer =>
        transfer.counterpartyEmail?.toLowerCase().includes(searchLower) ||
        transfer.counterpartyName?.toLowerCase().includes(searchLower) ||
        transfer.amount.toString().includes(searchLower) ||
        transfer.referenceType.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par date
    if (filters.startDate) {
      filtered = filtered.filter(transfer => 
        new Date(transfer.createdAt) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(transfer => 
        new Date(transfer.createdAt) <= new Date(filters.endDate + 'T23:59:59')
      );
    }

    // Filtre par direction
    if (filters.direction !== 'all') {
      filtered = filtered.filter(transfer => transfer.direction === filters.direction);
    }

    // Filtre par statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(transfer => transfer.status === filters.status);
    }

    return filtered;
  };

  const filteredTransfers = getFilteredTransfers();

  const handleExport = () => {
    if (filteredTransfers.length === 0) return;

    const headers = [
      'Date',
      'Direction',
      'Contrepartie',
      'Email',
      'Montant',
      'Frais',
      'Statut'
    ];

    const rows = filteredTransfers.map(transfer => [
      new Date(transfer.createdAt).toLocaleString('fr-FR'),
      transfer.direction === 'envoi' ? 'Envoi' : 'Réception',
      transfer.counterpartyName || 'N/A',
      transfer.counterpartyEmail || 'N/A',
      transfer.amount.toString(),
      transfer.feeAmount?.toString() || '0',
      transfer.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historique-transferts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'envoi' 
      ? <ArrowUpRight className="w-4 h-4 text-red-600" />
      : <ArrowDownRight className="w-4 h-4 text-green-600" />;
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'envoi' ? 'text-red-600' : 'text-green-600';
  };

  // Calculer les statistiques
  const stats = {
    totalTransfers: filteredTransfers.length,
    totalEnvois: filteredTransfers.filter(t => t.direction === 'envoi').length,
    totalReceptions: filteredTransfers.filter(t => t.direction === 'reception').length,
    totalAmount: filteredTransfers.reduce((sum, t) => sum + (t.transferAmount || t.amount), 0),
    totalFees: filteredTransfers.reduce((sum, t) => sum + (t.feeAmount || 0), 0)
  };

  return (
    <BaseDashboard title="Historique des Transferts">
      <TransferHistoryNav />
      
      <div className="space-y-6">
        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Filtres de recherche</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Direction
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filters.direction}
                  onChange={(e) => setFilters(prev => ({ ...prev, direction: e.target.value as 'all' | 'envoi' | 'reception' }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="all">Toutes les directions</option>
                  <option value="envoi">Envois</option>
                  <option value="reception">Réceptions</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as 'all' | 'completed' | 'pending' | 'failed' }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="completed">Terminé</option>
                  <option value="pending">En cours</option>
                  <option value="failed">Échoué</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button
              onClick={loadTransferHistory}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Recherche...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Rechercher les transferts</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Message d'information */}
        {transfers.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800">
              {!filters.startDate && !filters.endDate 
                ? "Cliquez sur \"Rechercher les transferts\" pour afficher votre historique. Vous pouvez utiliser les filtres de date pour limiter la recherche."
                : "Aucun transfert trouvé pour la période sélectionnée."}
            </p>
          </div>
        )}

        {/* Statistiques */}
        {transfers.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs sm:text-sm text-gray-600">Total</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.totalTransfers}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs sm:text-sm text-gray-600">Envois</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.totalEnvois}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs sm:text-sm text-gray-600">Réceptions</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.totalReceptions}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs sm:text-sm text-gray-600">Frais</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">{formatCurrency(stats.totalFees)}</p>
            </div>
          </div>
        )}

        {/* Barre de recherche et export */}
        {transfers.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                setFilters({
                  startDate: '',
                  endDate: '',
                  direction: 'all',
                  status: 'all'
                });
                setSearchTerm('');
                setTransfers([]);
              }}
              className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Réinitialiser
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par contrepartie, email, montant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleExport}
              disabled={filteredTransfers.length === 0}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Exporter CSV
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Résultats */}
        {loading ? (
          <LoadingState message="Recherche des transferts..." />
        ) : transfers.length === 0 ? (
          null
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-semibold">
                Historique des transferts ({filteredTransfers.length})
              </h2>
              <div className="text-xs sm:text-sm text-gray-600">
                Montant total: {formatCurrency(stats.totalAmount)}
              </div>
            </div>
            
            {/* Version mobile - cartes */}
            <div className="block sm:hidden">
              <div className="p-4 space-y-4">
                {filteredTransfers.map((transfer) => (
                  <div key={transfer.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getDirectionIcon(transfer.direction)}
                        <span className={`text-sm font-medium ${getDirectionColor(transfer.direction)}`}>
                          {transfer.direction === 'envoi' ? 'ENVOI' : 'RÉCEPTION'}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transfer.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : transfer.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transfer.status === 'completed' ? 'Terminé' :
                         transfer.status === 'pending' ? 'En cours' : 'Échoué'}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm font-medium">
                          {new Date(transfer.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Contrepartie:</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {transfer.counterpartyName || 'Nom non disponible'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {transfer.counterpartyEmail || 'Email non disponible'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Montant:</span>
                        <div className="text-right">
                          <div className={`font-medium ${getDirectionColor(transfer.direction)}`}>
                            {transfer.direction === 'envoi' ? '-' : '+'}
                            {formatCurrency(transfer.transferAmount || transfer.amount, transfer.currency)}
                          </div>
                          {transfer.feeAmount && transfer.feeAmount > 0 && (
                            <div className="text-xs text-orange-600">
                              Frais: {formatCurrency(transfer.feeAmount, transfer.currency)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Version desktop - tableau */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrepartie</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Frais</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transfer.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getDirectionIcon(transfer.direction)}
                          <span className={`text-sm font-medium ${getDirectionColor(transfer.direction)}`}>
                            {transfer.direction === 'envoi' ? 'ENVOI' : 'RÉCEPTION'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transfer.counterpartyName || 'Nom non disponible'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {transfer.counterpartyEmail || 'Email non disponible'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className={`font-medium ${getDirectionColor(transfer.direction)}`}>
                          {transfer.direction === 'envoi' ? '-' : '+'}
                          {formatCurrency(transfer.transferAmount || transfer.amount, transfer.currency)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {transfer.feeAmount && transfer.feeAmount > 0 ? (
                          <div className="text-sm text-orange-600">
                            {formatCurrency(transfer.feeAmount, transfer.currency)}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transfer.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : transfer.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transfer.status === 'completed' ? 'Terminé' :
                           transfer.status === 'pending' ? 'En cours' : 'Échoué'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </BaseDashboard>
  );
}