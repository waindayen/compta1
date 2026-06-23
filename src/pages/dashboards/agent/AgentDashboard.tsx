import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Trophy, Wallet } from 'lucide-react';
import BaseDashboard from '../BaseDashboard';

const quickActions = [
  { 
    label: 'Scanner un ticket',
    description: 'Scanner un ticket Lotto',
    path: '/dashboard/agent/lotto-tickets',
    icon: QrCode,
    color: 'blue'
  },
  { 
    label: 'Tickets Lotto',
    description: 'Gérer les tickets Lotto',
    path: '/dashboard/agent/lotto-tickets',
    icon: Trophy,
    color: 'green'
  }
];

export default function AgentDashboard() {

  return (
    <BaseDashboard title="Tableau de bord Agent">
      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.path}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className={`p-3 bg-${action.color}-100 rounded-lg`}>
                <action.icon className={`w-6 h-6 text-${action.color}-600`} />
              </div>
              <h3 className="font-medium text-lg">{action.label}</h3>
            </div>
            <p className="text-gray-600">{action.description}</p>
          </Link>
        ))}
      </div>
    </BaseDashboard>
  );
}