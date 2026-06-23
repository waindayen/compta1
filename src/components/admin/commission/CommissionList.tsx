import React from 'react';
import { Trophy, Edit, Percent } from 'lucide-react';
import type { CommissionConfig } from '../../../services/admin/commission';

interface CommissionListProps {
  commissions: CommissionConfig[];
  onEdit: (commission: CommissionConfig) => void;
}

const COMMISSION_LABELS: Record<string, string> = {
  simple: 'Paris Simple',
  combine: 'Paris Combiné',
  lotto_submission: 'Soumission Lotto',
  lotto_payment: 'Paiement Lotto',
  staff_transfer: 'Transfert Staff',
  agent_transfer: 'Transfert Agent'
};

export default function CommissionList({ commissions, onEdit }: CommissionListProps) {
  return (
    <div className="space-y-4">
      {commissions.map((commission) => (
        <div key={commission.id} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Percent className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">
                  {COMMISSION_LABELS[commission.betType] || commission.betType}
                </p>
                <p className="text-sm text-gray-600">
                  Mis à jour le {new Date(commission.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-blue-600">
                {commission.percentage}%
              </span>
              <button
                onClick={() => onEdit(commission)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Modifier"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}