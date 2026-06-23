import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import type { AgentTransaction } from '../../../services/agent/types';

interface TransactionListProps {
  transactions: AgentTransaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
      case 'commission':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'debit':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          Aucune transaction
        </div>
      ) : (
        transactions.map((transaction) => (
          <div key={transaction.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'debit'
                    ? 'bg-red-100'
                    : 'bg-green-100'
                }`}>
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium">
                    {transaction.type === 'credit' ? 'Crédit' :
                     transaction.type === 'debit' ? 'Débit' :
                     'Commission'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${
                  transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.type === 'debit' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className={`text-sm ${
                  transaction.status === 'completed' ? 'text-green-600' :
                  transaction.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {transaction.status === 'completed' ? 'Terminé' :
                   transaction.status === 'pending' ? 'En cours' :
                   'Échoué'}
                </p>
              </div>
            </div>
            {transaction.reason && (
              <p className="mt-2 text-sm text-gray-600 border-t border-gray-200 pt-2">
                {transaction.reason}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}