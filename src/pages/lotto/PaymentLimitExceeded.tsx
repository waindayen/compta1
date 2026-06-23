import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/format';

interface LocationState {
  amount?: number;
  limit?: number;
  ticketNumber?: string;
}

export default function PaymentLimitExceeded() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const state = location.state as LocationState;

  useEffect(() => {
    // Si l'utilisateur accède directement à cette page sans les données nécessaires
    if (!state?.amount && !state?.limit) {
      const basePath = userData?.role === 'staffuser' ? '/dashboard/staff' : '/dashboard/agent';
      navigate(`${basePath}/lotto-tickets`);
    }
  }, [state, navigate, userData]);

  const handleBackToTickets = () => {
    const basePath = userData?.role === 'staffuser' ? '/dashboard/staff' : '/dashboard/agent';
    navigate(`${basePath}/lotto-tickets`);
  };

  if (!state?.amount || !state?.limit) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Limite de paiement dépassée
          </h1>

          <p className="text-gray-600 text-center mb-6">
            Le montant de {formatCurrency(state.amount)} dépasse votre limite de paiement autorisée de {formatCurrency(state.limit)}.
            {state.ticketNumber && (
              <span className="block mt-2">
                Ticket n° {state.ticketNumber}
              </span>
            )}
          </p>

          <div className="w-full bg-yellow-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-700 text-center">
              Veuillez contacter un administrateur ou un manager pour effectuer ce paiement.
            </p>
          </div>

          <div className="w-full flex flex-col gap-4">
            <button
              onClick={handleBackToTickets}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour aux tickets
            </button>
            
            <button
              onClick={() => window.location.href = "tel:+123456789"}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Contacter l'administrateur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}