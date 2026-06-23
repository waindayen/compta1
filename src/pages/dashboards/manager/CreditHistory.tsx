import React, { useState, useEffect } from 'react';
import { Search, Calendar, AlertCircle, Download, Filter, BarChart } from 'lucide-react';
import BaseDashboard from '../BaseDashboard';
import { CreditHistoryService, CreditHistoryEntry } from '../../../services/admin/creditHistory';
import { formatCurrency } from '../../../utils/format';
import LoadingState from '../../../components/LoadingState';
import CreditHistoryNav from '../../../components/manager/wallet/CreditHistoryNav';

export default function CreditHistory() {
  const [history, setHistory] = useState<CreditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [typeFilter, setTypeFilter] = useState<'all' | 'agent' | 'staff'>('all');
  const [monthlyTotals, setMonthlyTotals] = useState<{[key: string]: number}>({});
  const [currentMonthTotal, setCurrentMonthTotal] = useState<number>(0);

  useEffect(() => {
    loadHistory();
  }, [dateFilter, typeFilter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      
      if (dateFilter.startDate) {
        filters.startDate = dateFilter.startDate;
      }
      
      if (dateFilter.endDate) {
        filters.endDate = dateFilter.endDate;
      }
      
      if (typeFilter !== 'all') {
        filters.recipientType = typeFilter;
      }
      
      const data = await CreditHistoryService.getCreditHistory(filters);
      setHistory(data);
      
      // Calculate monthly totals
      calculateMonthlyTotals(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique';
      setError(errorMessage);
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTotals = (data: CreditHistoryEntry[]) => {
    const totals: {[key: string]: number} = {};
    let currentMonth = 0;
    
    // Get current month and year
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    data.forEach(item => {
      const date = new Date(item.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!totals[monthKey]) {
        totals[monthKey] = 0;
      }
      
      totals[monthKey] += item.amount;
      
      // Calculate current month total
      if (monthKey === currentMonthKey) {
        currentMonth += item.amount;
      }
    });
    
    setMonthlyTotals(totals);
    setCurrentMonthTotal(currentMonth);
  };

  const filteredHistory = history.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.adminEmail?.toLowerCase().includes(searchLower) || '') ||
      (item.recipientEmail?.toLowerCase().includes(searchLower) || '') ||
      item.amount.toString().includes(searchLower) ||
      item.currency.toLowerCase().includes(searchLower)
    );
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Admin', 'Destinataire', 'Type', 'Montant', 'Devise'];
    const rows = filteredHistory.map(item => [
      new Date(item.createdAt).toLocaleString('fr-FR'),
      item.adminEmail || 'N/A',
      item.recipientEmail || 'N/A',
      item.recipientType === 'agent' ? 'Agent' : 'Staff',
      item.amount.toString(),
      item.currency
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historique_credits_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <BaseDashboard title="Historique des Crédits">
        <LoadingState message="Chargement de l'historique..." />
      </BaseDashboard>
    );
  }

  // Get sorted months for display
  const sortedMonths = Object.keys(monthlyTotals).sort((a, b) => b.localeCompare(a));

  // Format month for display
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  return (
    <BaseDashboard title="Historique des Crédits">
      <CreditHistoryNav />
      
      <div className="space-y-6">
        {/* Monthly Totals */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">Totaux Mensuels</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Current Month Highlight */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-800 mb-1">Mois en cours</p>
              <div className="flex justify-between items-center">
                <p className="font-medium text-blue-900">
                  {formatMonth(new Date().toISOString().slice(0, 7))}
                </p>
                <p className="text-xl font-bold text-blue-700">
                  {formatCurrency(currentMonthTotal)}
                </p>
              </div>
            </div>
            
            {/* Previous Months */}
            {sortedMonths.slice(0, 5).map(monthKey => {
              const now = new Date();
              const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
              
              // Skip current month as it's already displayed
              if (monthKey === currentMonthKey) return null;
              
              return (
                <div key={monthKey} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-700">{formatMonth(monthKey)}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(monthlyTotals[monthKey])}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="w-full md:w-48">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Date de début"
              />
            </div>
          </div>

          <div className="w-full md:w-48">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Date de fin"
              />
            </div>
          </div>

          <div className="w-full md:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'agent' | 'staff')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">Tous les types</option>
                <option value="agent">Agents</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exporter
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Tableau des transactions */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Admin</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Destinataire</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Aucun historique de crédit trouvé
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(item.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.adminEmail || 'N/A'}</div>
                        <div className="text-xs text-gray-500">ID: {item.adminId.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.recipientEmail || 'N/A'}</div>
                        <div className="text-xs text-gray-500">ID: {item.recipientId.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.recipientType === 'agent' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.recipientType === 'agent' ? 'Agent' : 'Staff'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">
                        {formatCurrency(item.amount, item.currency)}
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