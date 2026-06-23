import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import type { PaymentLimitConfig } from '../../../services/admin/paymentLimits';

interface AgentLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agentId: string, amount: number, agentEmail?: string) => Promise<void>;
  limit?: PaymentLimitConfig;
  agents: Array<{ id: string; email: string }>;
}

export default function AgentLimitModal({ 
  isOpen, 
  onClose, 
  onSave,
  limit,
  agents
}: AgentLimitModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState(limit?.agentId || '');
  const [amount, setAmount] = useState(limit?.maxPaymentAmount.toString() || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setIsSubmitting(true);

      if (!selectedAgentId) {
        throw new Error('Veuillez sélectionner un agent');
      }

      const value = parseFloat(amount);
      if (isNaN(value) || value <= 0) {
        throw new Error('Le montant doit être supérieur à 0');
      }

      const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
      await onSave(selectedAgentId, value, selectedAgent?.email);
      onClose();
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
            <h2 className="text-xl font-semibold">
              {limit ? 'Modifier la limite de paiement' : 'Ajouter une limite de paiement'}
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
              Agent
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting || !!limit}
              required
            >
              <option value="">Sélectionner un agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.email} (#{agent.id.slice(0, 8)})
                </option>
              ))}
            </select>
          </div>

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
                required
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                XAF
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Montant maximum que cet agent est autorisé à payer pour un ticket gagnant.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-2">
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
              disabled={isSubmitting || !selectedAgentId || !amount}
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