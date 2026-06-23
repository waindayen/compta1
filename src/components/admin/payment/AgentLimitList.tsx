import React from 'react';
import { CreditCard, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import type { PaymentLimitConfig } from '../../../services/admin/paymentLimits';

interface AgentLimitListProps {
  limits: PaymentLimitConfig[];
  onEdit: (limit: PaymentLimitConfig) => void;
  onDelete: (limitId: string) => void;
}

export default function AgentLimitList({ limits, onEdit, onDelete }: AgentLimitListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Agent</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Limite de paiement</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Dernière mise à jour</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {limits.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Aucune limite spécifique configurée
                </td>
              </tr>
            ) : (
              limits.map((limit) => (
                <tr key={limit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium">
                        Agent #{limit.agentId.slice(0, 8)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {limit.agentEmail || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(limit.maxPaymentAmount, limit.currency)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(limit.updatedAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(limit)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(limit.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}