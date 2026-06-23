import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/format';

interface LocationState {
  amount?: number;
  balance?: number;
  ticketNumber?: string;
}

export default function InsufficientBalance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const state = location.state as LocationState;

  useEffect(() => {
    // Si l'utilisateur accède directement à cette page sans les données nécessaires
    if (!state?.amount && !state?.balance) {
      const basePath = userData?.role === 'staffuser' ? '/dashboard/staff' : '/dashboard/agent';
      navigate(`${basePath}/lotto-tickets`);
    }
  }, [state, navigate, userData]);

  const handleBackToTickets = () => {
    const basePath = userData?.role === 'staffuser' ? '/dashboard/staff' : '/dashboard/agent';
    navigate(`${basePath}/lotto-tickets`);
  };

  if (!state?.amount || state?.balance === undefined) {
    return null;
  }

  const deficit = state.amount - state.balance;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Solde insuffisant
          </h1>

          <p className="text-gray-600 text-center mb-6">
            Votre solde actuel de {formatCurrency(state.balance)} est insuffisant pour payer le montant de {formatCurrency(state.amount)}.
            {state.ticketNumber && (
              <span className="block mt-2">
                Ticket n° {state.ticketNumber}
              </span>
            )}
          </p>

          <div className="w-full bg-yellow-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-yellow-600" />
              <p className="font-medium text-yellow-700">Détails du solde</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-yellow-700">Solde actuel:</span>
                <span className="font-medium">{formatCurrency(state.balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">Montant à payer:</span>
                <span className="font-medium">{formatCurrency(state.amount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-yellow-200">
                <span className="text-yellow-700 font-medium">Montant manquant:</span>
                <span className="font-bold text-red-600">{formatCurrency(deficit)}</span>
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-center mb-6">
            Veuillez contacter un administrateur ou un manager pour créditer votre compte avant de réessayer.
          </p>

          <button
            onClick={handleBackToTickets}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux tickets
          </button>
        </div>
      </div>
    </div>
  );
}