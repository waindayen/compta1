import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, ArrowLeft } from 'lucide-react';

export default function StaffCreationNav() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-medium">Création de Staff</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/dashboard/manager/staff-management"
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Gestion des Staffs</span>
          </Link>
          <Link
            to="/dashboard/manager"
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}