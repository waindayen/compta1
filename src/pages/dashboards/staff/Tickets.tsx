import React from 'react';
import BaseDashboard from '../BaseDashboard';
import { FileText } from 'lucide-react';

export default function Tickets() {
  return (
    <BaseDashboard title="Gestion des Tickets">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold">Tickets Support</h2>
        </div>
        
        {/* Contenu à implémenter */}
        <p className="text-gray-600">Fonctionnalité en cours de développement</p>
      </div>
    </BaseDashboard>
  );
}