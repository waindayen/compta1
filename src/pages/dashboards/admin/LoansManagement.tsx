import React, { useState, useEffect } from 'react';
import { Plus, FileText, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import LoanForm from '../../../components/loans/LoanForm';
import LoanList from '../../../components/loans/LoanList';
import LoadingState from '../../../components/LoadingState';
import {
  getAllLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  approveLoan,
  activateLoan,
  markLoanAsDefaulted,
  getLoanSummary,
  Loan,
  LoanSummary
} from '../../../services/loans';

export default function LoansManagement() {
  const { currentUser: user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loansData, summaryData] = await Promise.all([
        getAllLoans(),
        getLoanSummary()
      ]);
      setLoans(loansData);
      setSummary(summaryData);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    if (!user) return;
    await createLoan(data, user.uid);
    setShowForm(false);
    await loadData();
  };

  const handleUpdate = async (data: any) => {
    if (!selectedLoan) return;
    await updateLoan(selectedLoan.id, data);
    setShowForm(false);
    setSelectedLoan(null);
    await loadData();
  };

  const handleDelete = async (loan: Loan) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce prêt?`)) return;

    try {
      await deleteLoan(loan.id);
      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleApprove = async (loan: Loan) => {
    if (!user || !confirm('Approuver ce prêt?')) return;

    try {
      await approveLoan(loan.id, user.uid);
      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleActivate = async (loan: Loan) => {
    if (!confirm('Activer ce prêt?')) return;

    try {
      await activateLoan(loan.id);
      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleMarkDefaulted = async (loan: Loan) => {
    if (!confirm('Marquer ce prêt comme défaillant?')) return;

    try {
      await markLoanAsDefaulted(loan.id);
      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEdit = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowForm(true);
  };

  const filteredLoans = filterStatus === 'all'
    ? loans
    : loans.filter(loan => loan.status === filterStatus);

  if (loading) {
    return <LoadingState message="Chargement des prêts..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des prêts</h1>
            <p className="text-sm text-gray-500">Gérer tous les prêts</p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedLoan(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Nouveau prêt
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total prêts</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalLoans}</p>
              </div>
              <FileText className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Prêts actifs</p>
                <p className="text-2xl font-bold text-green-600">{summary.activeLoans}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Montant total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalDisbursed.toFixed(2)} €
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solde restant</p>
                <p className="text-2xl font-bold text-orange-600">
                  {summary.outstandingBalance.toFixed(2)} €
                </p>
              </div>
              <AlertCircle className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'approved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approuvés
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Actifs
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Terminés
            </button>
            <button
              onClick={() => setFilterStatus('defaulted')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'defaulted'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Défaillants
            </button>
          </div>
        </div>

        <LoanList
          loans={filteredLoans}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onApprove={handleApprove}
          onActivate={handleActivate}
          onMarkDefaulted={handleMarkDefaulted}
        />
      </div>

      {showForm && (
        <LoanForm
          loan={selectedLoan}
          onSubmit={selectedLoan ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setSelectedLoan(null);
          }}
        />
      )}
    </div>
  );
}
