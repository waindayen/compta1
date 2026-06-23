import React from 'react';
import { Trophy, ArrowUpRight } from 'lucide-react';
import { useStaffWallet } from '../../../hooks/useStaffWallet';
import { formatCurrency } from '../../../utils/format';
import LoadingState from '../../LoadingState';

export default function StaffCommissionDashboard() {
  const { wallet, commissionWallet, transactions, loading, error } = useStaffWallet();

  // Filtrer uniquement les transactions de commission
  const commissionTransactions = transactions.filter(t => t.type === 'commission');

  // Calculer les statistiques
  const totalCommissions = commissionWallet?.balance || 0;
  const todayCommissions = commissionTransactions
    .filter(t => {
      const today = new Date();
      const transactionDate = new Date(t.createdAt);
      return (
        transactionDate.getDate() === today.getDate() &&
        transactionDate.getMonth() === today.getMonth() &&
        transactionDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return <LoadingState message="Chargement des commissions..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques des commissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total des commissions</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalCommissions, commissionWallet?.currency || 'XAF')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowUpRight className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Commissions aujourd'hui</p>
              <p className="text-2xl font-bold">
                {formatCurrency(todayCommissions, commissionWallet?.currency || 'XAF')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historique des commissions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Historique des commissions</h2>
        <div className="space-y-4">
          {commissionTransactions.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              Aucune commission
            </p>
          ) : (
            commissionTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Commission</p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    +{formatCurrency(transaction.amount, transaction.currency || 'XAF')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {transaction.referenceType === 'payout' ? 'Paiement' : 'Crédit admin'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}