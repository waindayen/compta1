import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, X, Trophy } from 'lucide-react';

interface AuthDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function AuthDesktopModal({ isOpen, onClose, message = "Connectez-vous pour participer" }: AuthDesktopModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay avec effet de flou */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl p-8">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* En-tête */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <Trophy className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Contenu */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connexion requise
          </h2>
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Se connecter
          </button>
        </div>

        {/* Bouton annuler */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-gray-600 font-medium hover:text-gray-800"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}