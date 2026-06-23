import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LocationState {
  ticketNumber?: string;
}

export default function UnauthorizedCancel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const state = location.state as LocationState;

  const handleBack = () => {
    const basePath = userData?.role === 'staffuser' ? '/dashboard/staff' : '/dashboard/agent';
    navigate(`${basePath}/lotto-tickets`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Action non autorisée
          </h1>

          <p className="text-gray-600 text-center mb-6">
            {state?.ticketNumber ? (
              <>
                Le ticket n° {state.ticketNumber} ne peut pas être annulé car il a été créé par un autre agent. 
                Seul l'agent ayant créé le ticket peut l'annuler.
              </>
            ) : (
              'Vous ne pouvez annuler que les tickets que vous avez créés.'
            )}
          </p>

          <button
            onClick={handleBack}
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