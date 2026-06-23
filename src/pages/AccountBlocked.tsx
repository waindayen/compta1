import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AccountBlocked() {
  const { authError } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 mb-8">
            {authError || "Veuillez contacter l'administrateur"}
          </p>
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à l'accueil
            </Link>
            <a
              href="mailto:support@example.com"
              className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Contacter le support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}