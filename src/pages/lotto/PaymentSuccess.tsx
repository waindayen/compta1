import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface LocationState {
  amount?: number;
  ticketNumber?: string;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  useEffect(() => {
    // Si l'utilisateur accède directement à cette page sans les données nécessaires
    if (!state?.amount) {
      navigate('/dashboard/agent/lotto-tickets');
    }
  }, [state, navigate]);

  const handleBackToTickets = () => {
    navigate('/dashboard/agent/lotto-tickets');
  };

  if (!state?.amount) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Paiement effectué avec succès !
          </h1>

          <p className="text-gray-600 text-center mb-6">
            Le paiement de {formatCurrency(state.amount)} a été effectué avec succès.
            {state.ticketNumber && (
              <span className="block mt-2">
                Ticket n° {state.ticketNumber}
              </span>
            )}
          </p>

          <div className="w-full bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-700 text-center">
              Un reçu a été généré et imprimé automatiquement.
            </p>
          </div>

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