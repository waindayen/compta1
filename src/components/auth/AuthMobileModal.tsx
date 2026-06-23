import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, X } from 'lucide-react';

interface AuthMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function AuthMobileModal({ isOpen, onClose, message = "Connectez-vous pour participer" }: AuthMobileModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay avec effet de flou */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 transform transition-transform duration-300 ease-out">
        {/* Barre de drag indicator */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full" />

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Contenu */}
        <div className="mt-6 mb-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
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