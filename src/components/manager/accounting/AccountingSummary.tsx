import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';

interface AccountingSummaryProps {
  totalRevenue: number;
  totalExpense: number;
  balance: number;
  revenuesByCategory?: Record<string, number>;
  expensesByCategory?: Record<string, number>;
}

const CATEGORY_LABELS: Record<string, string> = {
  sales: 'Ventes',
  commissions: 'Commissions',
  bonuses: 'Bonus',
  operations: 'Opérations',
  salaries: 'Salaires',
  utilities: 'Services publics',
  supplies: 'Fournitures',
  maintenance: 'Maintenance',
  other: 'Autres'
};

export function AccountingSummary({
  totalRevenue,
  totalExpense,
  balance,
  revenuesByCategory,
  expensesByCategory
}: AccountingSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Recettes totales</p>
              <p className="text-3xl font-bold">{totalRevenue.toLocaleString('fr-FR')}</p>
              <p className="text-green-100 text-sm mt-1">FCFA</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium mb-1">Dépenses totales</p>
              <p className="text-3xl font-bold">{totalExpense.toLocaleString('fr-FR')}</p>
              <p className="text-red-100 text-sm mt-1">FCFA</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <TrendingDown className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${
          balance >= 0
            ? 'from-blue-500 to-blue-600'
            : 'from-orange-500 to-orange-600'
        } rounded-lg shadow-lg p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-sm font-medium mb-1">Solde</p>
              <p className="text-3xl font-bold">{balance.toLocaleString('fr-FR')}</p>
              <p className="text-white/90 text-sm mt-1">FCFA</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {(revenuesByCategory || expensesByCategory) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {revenuesByCategory && Object.keys(revenuesByCategory).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <PieChart className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Recettes par catégorie</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(revenuesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{CATEGORY_LABELS[category]}</span>
                    <span className="text-sm font-semibold text-green-600">
                      {amount.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expensesByCategory && Object.keys(expensesByCategory).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <PieChart className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Dépenses par catégorie</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{CATEGORY_LABELS[category]}</span>
                    <span className="text-sm font-semibold text-red-600">
                      {amount.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
