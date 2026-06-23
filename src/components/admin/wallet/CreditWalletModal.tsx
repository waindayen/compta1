import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';

interface CreditWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: {
    id: string;
    balance: number;
    currency: string;
    userEmail?: string;
  };
  onSubmit: (amount: number) => Promise<void>;
}

export default function CreditWalletModal({ 
  isOpen, 
  onClose, 
  wallet,
  onSubmit
}: CreditWalletModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setIsSubmitting(true);

      const creditAmount = parseFloat(amount);
      if (isNaN(creditAmount) || creditAmount <= 0) {
        throw new Error('Veuillez entrer un montant valide');
      }

      await onSubmit(creditAmount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Créditer le portefeuille</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Utilisateur</p>
              <p className="text-lg font-medium">{wallet.userEmail || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Solde actuel</p>
              <p className="text-xl font-bold">
                {formatCurrency(wallet.balance, wallet.currency)}
              </p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant à créditer
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                disabled={isSubmitting}
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                {wallet.currency}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Créditer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}