import React from 'react';
import { Wallet } from 'lucide-react';
import type { StaffWallet } from '../../../services/staff/types';
import { formatCurrency } from '../../../utils/format';

interface StaffWalletBalanceProps {
  wallet: StaffWallet;
}

export default function StaffWalletBalance({ wallet }: StaffWalletBalanceProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Solde disponible</p>
            <p className="text-2xl font-bold">
              {formatCurrency(wallet.balance, wallet.currency || 'XAF')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}