import React, { useState } from 'react';
import { useAgentWallet } from '../../../hooks/useAgentWallet';
import BaseDashboard from '../BaseDashboard';
import WalletBalance from '../../../components/agent/wallet/WalletBalance';
import ConvertCommissionModal from '../../../components/agent/wallet/ConvertCommissionModal';
import LoadingState from '../../../components/LoadingState';
import { AlertCircle, Wallet, Trophy, ArrowRight, Search } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';

export default function AgentWallet() {
  const { wallet, commissionWallet, loading, error } = useAgentWallet();
  const [showConvertModal, setShowConvertModal] = useState(false);

  if (loading) {
    return (
      <BaseDashboard title="Mon Portefeuille">
        {/* Afficher un loader optimisé */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseDashboard>
    );
  }

  if (!wallet || !commissionWallet) {
    return (
      <BaseDashboard title="Mon Portefeuille">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          Votre portefeuille n'est pas encore activé. Veuillez contacter l'administrateur.
        </div>
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Mon Portefeuille">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Soldes des portefeuilles - Affichage adapté pour mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Portefeuille principal */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Solde disponible</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {formatCurrency(wallet.balance, wallet.currency || 'XAF')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Portefeuille de commissions */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commissions</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {formatCurrency(commissionWallet.balance, commissionWallet.currency || 'XAF')}
                  </p>
                </div>
              </div>
              {commissionWallet.balance > 0 && (
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Convertir</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal de conversion */}
        {showConvertModal && (
          <ConvertCommissionModal
            isOpen={showConvertModal}
            onClose={() => setShowConvertModal(false)}
            commissionBalance={commissionWallet.balance}
            agentId={wallet.id}
            onConvertComplete={() => {
              // Recharger les données
              window.location.reload();
            }}
          />
        )}

      </div>
    </BaseDashboard>
  );
}