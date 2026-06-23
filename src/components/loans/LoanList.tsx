import React from 'react';
import { CreditCard as Edit2, Trash2, CheckCircle, XCircle, DollarSign, TrendingUp, CreditCard, History } from 'lucide-react';
import { Loan } from '../../services/loans/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LoanListProps {
  loans: Loan[];
  onEdit: (loan: Loan) => void;
  onDelete: (loan: Loan) => void;
  onApprove?: (loan: Loan) => void;
  onActivate?: (loan: Loan) => void;
  onMarkDefaulted?: (loan: Loan) => void;
  onSelect?: (loan: Loan) => void;
  onViewHistory?: (loan: Loan) => void;
}

export default function LoanList({
  loans,
  onEdit,
  onDelete,
  onApprove,
  onActivate,
  onMarkDefaulted,
  onSelect,
  onViewHistory
}: LoanListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'defaulted':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvé';
      case 'active':
        return 'Actif';
      case 'completed':
        return 'Terminé';
      case 'defaulted':
        return 'Défaillant';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  if (loans.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Aucun prêt trouvé</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Emprunteur
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Taux
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Durée
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Paiement mensuel
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Progression
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loans.map((loan) => {
            const progress = (loan.totalPaid / loan.totalAmount) * 100;
            return (
              <tr key={loan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {loan.borrowerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(loan.startDate), 'dd MMM yyyy', { locale: fr })}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {loan.amount.toFixed(2)} €
                  </div>
                  <div className="text-xs text-gray-500">
                    Total: {loan.totalAmount.toFixed(2)} €
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-sm text-gray-900">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    {loan.interestRate}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {loan.term}{' '}
                  {loan.termUnit === 'days'
                    ? 'j'
                    : loan.termUnit === 'weeks'
                    ? 'sem'
                    : loan.termUnit === 'months'
                    ? 'mois'
                    : 'ans'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {loan.monthlyPayment.toFixed(2)} €
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-gray-500">
                      {loan.totalPaid.toFixed(2)} € / {loan.totalAmount.toFixed(2)} €
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {progress.toFixed(1)}%
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      loan.status
                    )}`}
                  >
                    {getStatusLabel(loan.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {onViewHistory && (
                      <button
                        onClick={() => onViewHistory(loan)}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 border border-gray-300"
                        title="Voir l'historique des paiements"
                      >
                        <History className="h-3 w-3" />
                        Historique
                      </button>
                    )}
                    {(loan.status === 'active' || loan.status === 'approved') && onSelect && (
                      <button
                        onClick={() => onSelect(loan)}
                        className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        title="Enregistrer un paiement"
                      >
                        <CreditCard className="h-3 w-3" />
                        Paiement
                      </button>
                    )}
                    {loan.status === 'pending' && onApprove && (
                      <button
                        onClick={() => onApprove(loan)}
                        className="text-green-600 hover:text-green-900"
                        title="Approuver"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {loan.status === 'approved' && onActivate && (
                      <button
                        onClick={() => onActivate(loan)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Activer"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {loan.status === 'active' && onMarkDefaulted && (
                      <button
                        onClick={() => onMarkDefaulted(loan)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Marquer comme défaillant"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(loan)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(loan)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
