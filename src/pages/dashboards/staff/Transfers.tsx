import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import BaseDashboard from '../BaseDashboard';
import { useStaffWallet } from '../../../hooks/useStaffWallet';
import TransferCreditModal from '../../../components/staff/wallet/TransferCreditModal';
import TransferToAgentModal from '../../../components/staff/wallet/TransferToAgentModal';
import LoadingState from '../../../components/LoadingState';
import { formatCurrency } from '../../../utils/format';

export default function Transfers() {
  const { wallet, loading, error } = useStaffWallet();
  const [showStaffTransferModal, setShowStaffTransferModal] = useState(false);
  const [showAgentTransferModal, setShowAgentTransferModal] = useState(false);

  if (loading) {
    return (
      <BaseDashboard title="Transferts">
        <LoadingState message="Chargement des transferts..." />
      </BaseDashboard>
    );
  }

  if (!wallet) {
    return (
      <BaseDashboard title="Transferts">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          Votre portefeuille n'est pas encore activé. Veuillez contacter l'administrateur.
        </div>
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Transferts">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* En-tête avec solde et boutons de transfert */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Solde disponible</p>
              <p className="text-2xl font-bold">{formatCurrency(wallet.balance)}</p>
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
              <button
                onClick={() => setShowStaffTransferModal(true)}
                className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>Transférer à un staff</span>
              </button>
              <button
                onClick={() => setShowAgentTransferModal(true)}
                className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>Transférer à un agent</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showStaffTransferModal && (
          <TransferCreditModal
            isOpen={showStaffTransferModal}
            onClose={() => setShowStaffTransferModal(false)}
            currentBalance={wallet.balance}
            staffId={wallet.id}
          />
        )}

        {showAgentTransferModal && (
          <TransferToAgentModal
            isOpen={showAgentTransferModal}
            onClose={() => setShowAgentTransferModal(false)}
            currentBalance={wallet.balance}
            staffId={wallet.id}
          />
        )}
      </div>
    </BaseDashboard>
  );
}