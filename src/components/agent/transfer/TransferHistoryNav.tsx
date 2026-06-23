import React from 'react';
import { History } from 'lucide-react';

export default function TransferHistoryNav() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center gap-2">
        <History className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-medium">Historique des Transferts</h2>
      </div>
    </div>
  );
}