import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/format';

interface LocationState {
  amount?: number;
  recipientEmail?: string;
  recipientName?: string;
  transferType?: 'staff' | 'agent';
  feeAmount?: number;
  totalAmount?: number;
}

export default function TransferSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const state = location.state as LocationState;

  useEffect(() => {
    // Si l'utilisateur accède directement à cette page sans les données nécessaires
    if (!state?.amount || !state?.recipientEmail) {
      const basePath = userData?.role === 'staffuser' ? '/dashboard/staff' : '/dashboard/agent';
      navigate(`${basePath}/transfers`);
    }
  }, [state, navigate, userData]);

  const handleBackToTransfers = () => {
    const basePath = userData?.role === 'staffuser' ? '/dashboard/staff' : '/dashboard/agent';
    navigate(`${basePath}/transfers`);
  };

  const handleBackToWallet = () => {
    const basePath = userData?.role === 'staffuser' ? '/dashboard/staff' : '/dashboard/agent';
    navigate(`${basePath}/wallet`);
  };

  if (!state?.amount || !state?.recipientEmail) {
    return null;
  }

  const getRecipientTypeLabel = () => {
    if (state.transferType === 'staff') return 'staff';
    if (state.transferType === 'agent') return 'agent';
    return 'utilisateur';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Transfert effectué avec succès !
          </h1>

          <p className="text-gray-600 text-center mb-6">
            Votre transfert de {formatCurrency(state.amount)} vers le {getRecipientTypeLabel()} a été effectué avec succès.
          </p>

          {/* Détails du transfert */}
          <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Destinataire:</span>
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  {state.recipientName || 'Nom non disponible'}
                </div>
                <div className="text-sm text-gray-600">
                  {state.recipientEmail}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Montant transféré:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(state.amount)}
              </span>
            </div>
            
            {state.feeAmount && state.feeAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Frais:</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(state.feeAmount)}
                </span>
              </div>
            )}
            
            {state.totalAmount && state.totalAmount !== state.amount && (
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-600 font-medium">Total débité:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(state.totalAmount)}
                </span>
              </div>
            )}
          </div>

          <div className="w-full bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-5 h-5 text-blue-600" />
              <p className="font-medium text-blue-700">Transfert confirmé</p>
            </div>
            <p className="text-sm text-blue-700">
              Le montant a été transféré avec succès. Le destinataire peut maintenant utiliser ces fonds.
            </p>
          </div>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleBackToWallet}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour au portefeuille
            </button>
            
            <button
              onClick={handleBackToTransfers}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Send className="w-5 h-5" />
              Nouveau transfert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}