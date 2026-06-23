import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';

interface PaymentLimitFormProps {
  currentAmount: number;
  currency: string;
  onSave: (amount: number) => Promise<void>;
}

export default function PaymentLimitForm({ currentAmount, currency, onSave }: PaymentLimitFormProps) {
  const [amount, setAmount] = useState(currentAmount.toString());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setIsSubmitting(true);

      const value = parseFloat(amount);
      if (isNaN(value) || value <= 0) {
        throw new Error('Le montant doit être supérieur à 0');
      }

      await onSave(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Montant maximum de paiement
        </label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              if (/^\d*\.?\d*$/.test(e.target.value)) {
                setAmount(e.target.value);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
            disabled={isSubmitting}
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
            {currency}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Montant maximum qu'un agent est autorisé à payer pour un ticket gagnant.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            <span>Sauvegarde...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Sauvegarder</span>
          </>
        )}
      </button>
    </form>
  );
}