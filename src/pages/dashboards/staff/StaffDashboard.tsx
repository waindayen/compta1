import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, HelpCircle } from 'lucide-react';

export default function StaffDashboard() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tableau de bord Staff</h1>
        <p className="text-gray-600">Gérez vos activités quotidiennes</p>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/dashboard/staff/lotto-tickets"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Tickets Lotto</h3>
              <p className="text-gray-600">Gérer les tickets et paiements</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/staff/clients"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Clients</h3>
              <p className="text-gray-600">Gérer les clients</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/staff/support"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <HelpCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Support</h3>
              <p className="text-gray-600">Gérer les tickets support</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}