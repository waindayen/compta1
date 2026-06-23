import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Users, Star } from 'lucide-react';
import WelcomeHero from '../components/home/WelcomeHero';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <WelcomeHero />

      {/* Statistiques et fonctionnalités */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Section des statistiques */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pourquoi choisir Ndex36 ?
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            La plateforme de lotto la plus fiable avec un réseau d'agents professionnels
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tirages Réguliers</h3>
              <p className="text-gray-600">
                Des tirages quotidiens, hebdomadaires et spéciaux avec des jackpots attractifs
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Réseau d'Agents</h3>
              <p className="text-gray-600">
                Un réseau d'agents qualifiés partout pour vous servir et vous accompagner
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Paiements Sécurisés</h3>
              <p className="text-gray-600">
                Système de paiement sécurisé et rapide pour vos gains et participations
              </p>
            </div>
          </div>
        </div>

        {/* Section des lottos en cours */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Lottos en cours
              </h2>
              <p className="text-gray-600">
                Participez aux tirages actuellement ouverts
              </p>
            </div>
            <Link
              to="/lotto"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Trophy className="w-5 h-5" />
              Voir tous les lottos
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder pour les lottos - pas de requête */}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Consultez la page Lotto pour voir les tirages disponibles
              </p>
              <Link
                to="/lotto"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir les lottos
                <TrendingUp className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Section des résultats récents */}
        <div className="mt-16 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Résultats des derniers tirages
            </h2>
            <p className="text-gray-600 mb-8">
              Découvrez les numéros gagnants des tirages récents
            </p>
            <Link
              to="/lotto/results"
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Trophy className="w-5 h-5" />
              Voir les résultats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}