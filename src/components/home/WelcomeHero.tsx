import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function WelcomeHero() {
  return (
    <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1563237023-b1e970526dcb?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Tentez Votre Chance avec Ndex36
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-blue-100">
            La meilleure plateforme de lotto avec un réseau d'agents à votre service
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/lotto"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors"
            >
              Jouer au Lotto
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/lotto/results"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-lg text-white hover:bg-blue-500 transition-colors"
            >
              Voir les résultats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}