import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { CommissionConfig, CommissionType } from '../../../services/admin/commission';

interface CommissionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission: CommissionConfig;
  onSave: (betType: CommissionType, percentage: number) => Promise<void>;
}

const COMMISSION_LABELS: Record<string, string> = {
  simple: 'Paris Simple',
  combine: 'Paris Combiné',
  lotto_submission: 'Soumission Lotto',
  lotto_payment: 'Paiement Lotto',
  staff_transfer: 'Transfert Staff',
  agent_transfer: 'Transfert Agent'
};

export default function CommissionEditModal({ 
  isOpen, 
  onClose, 
  commission,
  onSave
}: CommissionEditModalProps) {
  const [percentage, setPercentage] = useState(commission.percentage.toString());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setIsSubmitting(true);

      const value = parseFloat(percentage);
      if (isNaN(value) || value < 0 || value > 100) {
        throw new Error('Le pourcentage doit être entre 0 et 100');
      }

      await onSave(commission.betType as CommissionType, value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePercentageChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setPercentage(value);
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Modifier la commission
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de transaction
            </label>
            <input
              type="text"
              value={COMMISSION_LABELS[commission.betType] || commission.betType}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pourcentage de commission
            </label>
            <div className="relative">
              <input
                type="text"
                value={percentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0-100"
                disabled={isSubmitting}
                required
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Pourcentage de commission appliqué à ce type de transaction
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </form>
      </div>
    </div>
  );
}