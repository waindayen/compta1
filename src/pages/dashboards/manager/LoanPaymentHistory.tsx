import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, History, TrendingDown, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import PaymentForm from '../../../components/loans/PaymentForm';
import PaymentList from '../../../components/loans/PaymentList';
import LoadingState from '../../../components/LoadingState';
import {
  getLoan,
  getPaymentsByLoan,
  recordPayment,
  deletePayment,
  Loan,
  LoanPayment
} from '../../../services/loans';

export default function ManagerLoanPaymentHistory() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loanId) loadData(loanId);
  }, [loanId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const [loanData, paymentsData] = await Promise.all([
        getLoan(id),
        getPaymentsByLoan(id)
      ]);
      setLoan(loanData);
      setPayments(paymentsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (data: any) => {
    if (!user || !loanId) return;
    await recordPayment(data, user.uid);
    setShowPaymentForm(false);
    await loadData(loanId);
  };

  const handleDeletePayment = async (payment: LoanPayment) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement?') || !loanId) return;
    try {
      await deletePayment(payment.id);
      await loadData(loanId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingState message="Chargement..." />;

  if (error || !loan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-gray-600">{error || 'Prêt introuvable'}</p>
        <button
          onClick={() => navigate('/dashboard/manager/loan-payments')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retour aux remboursements
        </button>
      </div>
    );
  }

  const progress = (loan.totalPaid / loan.totalAmount) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/manager/loan-payments')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <History className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Historique des paiements</h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{loan.borrowerName}</p>
          </div>
        </div>
        {(loan.status === 'active' || loan.status === 'approved') && (
          <button
            onClick={() => setShowPaymentForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Enregistrer un paiement
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Montant du prêt</p>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{loan.amount.toFixed(2)} €</p>
          <p className="text-xs text-gray-400 mt-1">Total avec intérêts: {loan.totalAmount.toFixed(2)} €</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total payé</p>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{loan.totalPaid.toFixed(2)} €</p>
          <p className="text-xs text-gray-400 mt-1">{payments.length} paiement{payments.length > 1 ? 's' : ''} enregistré{payments.length > 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Solde restant</p>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{loan.remainingBalance.toFixed(2)} €</p>
          <p className="text-xs text-gray-400 mt-1">Mensualité: {loan.monthlyPayment.toFixed(2)} €</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</p>
            <span className="text-xs font-bold text-blue-600">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <History className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Paiements effectués</h3>
        </div>
        <PaymentList payments={payments} onDelete={handleDeletePayment} />
      </div>

      {showPaymentForm && (
        <PaymentForm
          loan={loan}
          onSubmit={handleRecordPayment}
          onCancel={() => setShowPaymentForm(false)}
        />
      )}
    </div>
  );
}
