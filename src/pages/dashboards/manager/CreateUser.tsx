import React from 'react';
import BaseDashboard from '../BaseDashboard';
import UserCreationForm from '../../../components/manager/UserCreationForm';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreateUser() {
  return (
    <BaseDashboard title="Créer un agent">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-medium">Création d'un nouvel agent</h2>
        </div>
        <Link
          to="/dashboard/manager/users"
          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste</span>
        </Link>
      </div>

      <UserCreationForm />
    </BaseDashboard>
  );
}