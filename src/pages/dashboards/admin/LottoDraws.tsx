import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseDashboard from '../BaseDashboard';
import PendingDraws from '../../../components/lotto/draws/PendingDraws';
import PrizeHistory from '../../../components/lotto/draws/PrizeHistory';
import { Trophy, History, Info } from 'lucide-react';

export default function LottoDraws() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const tabs = [
    { 
      id: 'pending',
      label: 'En attente de calcul',
      icon: Trophy
    },
    { 
      id: 'history',
      label: 'Historique des gains',
      icon: History
    }
  ];

  return (
    <BaseDashboard title="Gestion des Tirages Lotto">
      {/* Message d'information sur la sécurité */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-800">Sécurité des tirages</h3>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Une seule demande de calcul de gains est autorisée par lotto</li>
          <li>• Les numéros gagnants sont verrouillés dès leur première définition</li>
          <li>• Seul un rejet de la demande peut déverrouiller les numéros</li>
          <li>• Les gains calculés sont définitifs et ne peuvent pas être modifiés</li>
        </ul>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'pending' | 'history')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pending' ? <PendingDraws /> : <PrizeHistory />}
    </BaseDashboard>
  );
}