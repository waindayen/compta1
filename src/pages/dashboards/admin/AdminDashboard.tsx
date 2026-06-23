import React from 'react';
import { Link } from 'react-router-dom';
import BaseDashboard from '../BaseDashboard';
import { Users, Trophy, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const quickActions = [
    {
      title: 'Gestion',
      items: [
        { 
          label: 'Gestion des utilisateurs',
          description: 'Gérer les comptes utilisateurs',
          path: '/dashboard/admin/users',
          icon: Users,
          color: 'blue'
        }
      ]
    },
    {
      title: 'Paris',
      items: [
        { 
          label: 'Lottos',
          description: 'Gérer les lottos et les tirages',
          path: '/dashboard/admin/lottos',
          icon: Trophy,
          color: 'yellow'
        }
      ]
    },
    {
      title: 'Configuration',
      items: [
        { 
          label: 'Paramètres',
          description: 'Configuration générale du site',
          path: '/dashboard/admin/site-config',
          icon: Settings,
          color: 'purple'
        }
      ]
    }
  ];

  return (
    <BaseDashboard title="Tableau de bord Administrateur">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {quickActions.map((section, index) => (
          <div key={index} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
            {section.items.map((action, actionIndex) => (
              <Link
                key={actionIndex}
                to={action.path}
                className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-${action.color}-100 rounded-lg`}>
                    <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.label}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </BaseDashboard>
  );
}