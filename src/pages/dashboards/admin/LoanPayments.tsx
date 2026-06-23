import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoanList from '../../../components/loans/LoanList';
import LoadingState from '../../../components/LoadingState';
import {
  getLoansByStatus,
  Loan
} from '../../../services/loans';

export default function LoanPayments() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const activeLoans = await getLoansByStatus('active');
      const approvedLoans = await getLoansByStatus('approved');
      setLoans([...activeLoans, ...approvedLoans]);
    } catch (error: any) {
      console.error('Error loading loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLoan = (loan: Loan) => {
    navigate(`/dashboard/admin/loan-payments/${loan.id}`);
  };

  const handleViewHistory = (loan: Loan) => {
    navigate(`/dashboard/admin/loan-payments/${loan.id}`);
  };

  if (loading) {
    return <LoadingState message="Chargement..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Remboursements</h1>
          <p className="text-sm text-gray-500">Gérer les paiements des prêts</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Prêts actifs et approuvés</h3>
          <p className="text-sm text-gray-500">Cliquez sur "Paiement" pour enregistrer un paiement ou "Historique" pour consulter les paiements</p>
        </div>
        <LoanList
          loans={loans}
          onEdit={() => {}}
          onDelete={() => {}}
          onSelect={handleSelectLoan}
          onViewHistory={handleViewHistory}
        />
      </div>
    </div>
  );
}
