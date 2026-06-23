import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Download, ArrowUpRight, ArrowDownRight, Users, RefreshCw, AlertCircle } from 'lucide-react';
import BaseDashboard from '../BaseDashboard';
import { TransactionTraceabilityService, TransactionTrace, TraceabilityFilters } from '../../../services/admin/transactionTraceability';
import { formatCurrency } from '../../../utils/format';
import LoadingState from '../../../components/LoadingState';

export default function StaffTransactionTraceability() {
  const [transactions, setTransactions] = useState<TransactionTrace[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email: string; name: string; role: string }>>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TraceabilityFilters>({
    startDate: '',
    endDate: '',
    userId: '',
    transactionType: 'all',
    referenceType: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrer les utilisateurs en fonction du terme de recherche
  const filteredUsers = users.filter(user => {
    if (!userSearchTerm.trim()) return false;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower)
    );
  });

  const handleUserSelect = (user: { id: string; email: string; name: string; role: string }) => {
    setSelectedUser(user);
    setUserSearchTerm(user.email);
    setShowUserDropdown(false);
    setFilters(prev => ({ ...prev, userId: user.id }));
  };

  const handleUserSearchChange = (value: string) => {
    setUserSearchTerm(value);
    setShowUserDropdown(value.trim().length > 0);
    
    // Si l'utilisateur efface le champ, réinitialiser la sélection
    if (!value.trim()) {
      setSelectedUser(null);
      setFilters(prev => ({ ...prev, userId: '' }));
    }
    
    // Si la valeur ne correspond plus à l'utilisateur sélectionné, le désélectionner
    if (selectedUser && value !== selectedUser.email) {
      setSelectedUser(null);
      setFilters(prev => ({ ...prev, userId: '' }));
    }
  };

  const handleSearch = async () => {
    if (!filters.startDate) {
      setError('Veuillez sélectionner une date de début');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await TransactionTraceabilityService.getTransactionHistory(filters);
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche des transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await TransactionTraceabilityService.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleFilterChange = (key: keyof TraceabilityFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: '',
      transactionType: 'all',
      referenceType: 'all'
    });
    setSearchTerm('');
    setTransactions([]);
    setError(null);
    setSelectedUser(null);
    setUserSearchTerm('');
  };

  const handleExport = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      'Date',
      'Type de compte',
      'Utilisateur',
      'Email',
      'Type de transaction',
      'Montant',
      'Devise',
      'Type de référence',
      'Statut',
      'Contrepartie',
      'Email contrepartie',
      'Montant transfert',
      'Frais'
    ];

    const rows = filteredTransactions.map(transaction => [
      new Date(transaction.createdAt).toLocaleString('fr-FR'),
      transaction.type === 'agent_transaction' ? 'Agent' : 'Staff',
      transaction.userName || 'N/A',
      transaction.userEmail || 'N/A',
      transaction.transactionType,
      transaction.amount.toString(),
      transaction.currency,
      transaction.referenceType,
      transaction.status,
      transaction.counterpartyName || 'N/A',
      transaction.counterpartyEmail || 'N/A',
      transaction.transferAmount?.toString() || 'N/A',
      transaction.feeAmount?.toString() || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions-traceability-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getTransactionIcon = (transactionType: string) => {
    switch (transactionType) {
      case 'credit':
      case 'commission':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'debit':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTransactionTypeLabel = (transaction: TransactionTrace) => {
    // Utiliser la direction du transfert si disponible
    if (transaction.transferDirection) {
      return transaction.transferDirection === 'envoi' ? 'Envoi' : 'Réception';
    }
    
    // Fallback sur le type de transaction
    const transactionType = transaction.transactionType;
    switch (transactionType) {
      case 'credit': return 'Crédit';
      case 'debit': return 'Débit';
      case 'commission': return 'Commission';
      default: return transactionType;
    }
  };

  const getReferenceTypeLabel = (referenceType: string) => {
    switch (referenceType) {
      case 'transfer': return 'Transfert staff-staff';
      case 'agent_transfer': return 'Transfert d\'agent';
      case 'staff_transfer': return 'Transfert de staff';
      case 'transfer_fee': return 'Frais de transfert';
      default: return referenceType;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.userEmail?.toLowerCase().includes(searchLower) ||
      transaction.userName?.toLowerCase().includes(searchLower) ||
      transaction.counterpartyEmail?.toLowerCase().includes(searchLower) ||
      transaction.counterpartyName?.toLowerCase().includes(searchLower) ||
      transaction.referenceType.toLowerCase().includes(searchLower) ||
      transaction.amount.toString().includes(searchLower)
    );
  });

  // Calculer les statistiques
  const stats = {
    totalTransactions: filteredTransactions.length,
    totalReceptions: filteredTransactions.filter(t => t.transactionType === 'credit').length,
    totalEnvois: filteredTransactions.filter(t => t.transactionType === 'debit').length,
    totalAmount: filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
    transfersCount: filteredTransactions.filter(t => 
      t.referenceType.includes('transfer') || t.transferTo || t.transferFrom
    ).length
  };

  return (
    <BaseDashboard title="Traçabilité des Transactions">
      <div className="space-y-6">
        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Filtres de recherche</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Période */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
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
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Utilisateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Utilisateur
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => handleUserSearchChange(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loadingUsers}
                />
                {loadingUsers && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                
                {/* Dropdown des utilisateurs filtrés */}
                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {filteredUsers.slice(0, 10).map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 flex items-center justify-center rounded-full ${
                            user.role === 'agentuser' ? 'bg-blue-100' : 'bg-purple-100'
                          }`}>
                            <span className={`text-sm font-medium ${
                              user.role === 'agentuser' ? 'text-blue-600' : 'text-purple-600'
                            }`}>
                              {user.role === 'agentuser' ? 'A' : 'S'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.role === 'agentuser' ? 'Agent' : 'Staff'} • ID: {user.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {filteredUsers.length > 10 && (
                      <div className="px-4 py-2 text-sm text-gray-500 text-center border-t border-gray-100">
                        {filteredUsers.length - 10} autres utilisateurs...
                      </div>
                    )}
                  </div>
                )}
                
                {/* Message si aucun utilisateur trouvé */}
                {showUserDropdown && filteredUsers.length === 0 && userSearchTerm.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-4 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </div>
                )}
              </div>
            </div>

            {/* Type de transaction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de transaction
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filters.transactionType}
                  onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="all">Tous les types</option>
                  <option value="credit">Réceptions</option>
                  <option value="debit">Envois</option>
                </select>
              </div>
            </div>

            {/* Type de référence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de référence
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filters.referenceType}
                  onChange={(e) => handleFilterChange('referenceType', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="all">Tous les types</option>
                  <option value="transfer">Transferts staff-staff</option>
                  <option value="agent_transfer">Transferts d'agents</option>
                  <option value="staff_transfer">Transferts de staffs</option>
                  <option value="transfer_fee">Frais de transfert</option>
                </select>
              </div>
            </div>

            {/* Bouton de recherche */}
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Recherche...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Rechercher</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Utilisateur sélectionné */}
          {selectedUser && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 flex items-center justify-center rounded-full ${
                  selectedUser.role === 'agentuser' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <span className={`text-sm font-medium ${
                    selectedUser.role === 'agentuser' ? 'text-blue-600' : 'text-purple-600'
                  }`}>
                    {selectedUser.role === 'agentuser' ? 'A' : 'S'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-green-800">
                    Utilisateur sélectionné: {selectedUser.name}
                  </div>
                  <div className="text-sm text-green-700">
                    {selectedUser.email} • {selectedUser.role === 'agentuser' ? 'Agent' : 'Staff'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setUserSearchTerm('');
                    setFilters(prev => ({ ...prev, userId: '' }));
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Réinitialiser
            </button>
            <div className="text-sm text-gray-500">
              {transactions.length > 0 && `${filteredTransactions.length} transaction(s) trouvée(s)`}
            </div>
          </div>
        </div>

        {/* Message d'information */}
        {transactions.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800">
              Utilisez les filtres ci-dessus et cliquez sur "Rechercher" pour afficher l'historique des transferts.
              La date de début est obligatoire.
            </p>
          </div>
        )}

        {/* Statistiques */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Total transactions</p>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Réceptions</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalReceptions}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Envois</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalEnvois}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Transferts</p>
              <p className="text-2xl font-bold text-blue-600">{stats.transfersCount}</p>
            </div>
          </div>
        )}

        {/* Barre de recherche et export */}
        {transactions.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par utilisateur, email, contrepartie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
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
          <LoadingState message="Recherche des transactions..." />
        ) : transactions.length === 0 ? (
          null
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Transactions ({filteredTransactions.length})
              </h2>
              <div className="text-sm text-gray-600">
                Montant total: {formatCurrency(stats.totalAmount)}
              </div>
            </div>
            
            {/* Version mobile - cartes */}
            <div className="block md:hidden">
              <div className="p-4 space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div key={`${transaction.type}-${transaction.id}`} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.transactionType)}
                        <span className={`text-sm font-medium ${
                          transaction.transferDirection === 'envoi' ? 'text-red-600' :
                          transaction.transferDirection === 'reception' ? 'text-green-600' :
                          ''
                        }`}>
                          {getTransactionTypeLabel(transaction)}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status === 'completed' ? 'Terminé' :
                         transaction.status === 'pending' ? 'En cours' : 'Échoué'}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm font-medium">
                          {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Utilisateur:</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.userName || 'Nom non disponible'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {transaction.userEmail || 'Email non disponible'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Montant:</span>
                        <div className="text-right">
                          <div className={`font-medium ${
                            transaction.transactionType === 'debit' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {transaction.transactionType === 'debit' ? '-' : '+'}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </div>
                          {transaction.feeAmount && transaction.feeAmount > 0 && (
                            <div className="text-xs text-gray-500">
                              Frais: {formatCurrency(transaction.feeAmount, transaction.currency)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {transaction.counterpartyEmail && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Contrepartie:</span>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.counterpartyName || 'Nom non disponible'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {transaction.counterpartyEmail}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Référence:</span>
                        <span className="text-sm px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                          {getReferenceTypeLabel(transaction.referenceType)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Version desktop - tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrepartie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 flex items-center justify-center rounded-full ${
                            transaction.type === 'agent_transaction' 
                              ? 'bg-blue-100' 
                              : 'bg-purple-100'
                          }`}>
                            <span className={`text-sm font-medium ${
                              transaction.type === 'agent_transaction' 
                                ? 'text-blue-600' 
                                : 'text-purple-600'
                            }`}>
                              {transaction.type === 'agent_transaction' ? 'A' : 'S'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {transaction.userName || 'Nom non disponible'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {transaction.userEmail || 'Email non disponible'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.transactionType)}
                          <span className={`text-sm font-medium ${
                            transaction.transferDirection === 'envoi' ? 'text-red-600' :
                            transaction.transferDirection === 'reception' ? 'text-green-600' :
                            ''
                          }`}>
                            {getTransactionTypeLabel(transaction)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-medium ${
                          transaction.transactionType === 'debit' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.transactionType === 'debit' ? '-' : '+'}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                        {transaction.feeAmount && transaction.feeAmount > 0 && (
                          <div className="text-xs text-gray-500">
                            Frais: {formatCurrency(transaction.feeAmount, transaction.currency)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {getReferenceTypeLabel(transaction.referenceType)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {transaction.counterpartyEmail ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.counterpartyName || 'Nom non disponible'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {transaction.counterpartyEmail}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status === 'completed' ? 'Terminé' :
                           transaction.status === 'pending' ? 'En cours' : 'Échoué'}
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