import React from 'react';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">À propos de Ndex36</h1>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 mb-4">
            Ndex36 est votre plateforme de lotto de confiance. Notre mission est de vous offrir une expérience de jeu exceptionnelle, sécurisée et responsable.
          </p>
          <p className="text-gray-600 mb-4">
            Nous proposons une large sélection de tirages lotto avec des gains attractifs et une interface utilisateur intuitive, vous permettant de participer facilement à nos jeux.
          </p>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">Nos valeurs</h2>
            <ul className="space-y-2">
              <li className="flex items-center text-blue-700">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Transparence
              </li>
              <li className="flex items-center text-blue-700">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Sécurité
              </li>
              <li className="flex items-center text-blue-700">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Innovation
              </li>
            </ul>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-900 mb-3">Notre offre Lotto</h2>
            <p className="text-yellow-700 mb-2">
              Ndex36 vous propose des tirages lotto réguliers avec:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-yellow-700">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Des tirages quotidiens, hebdomadaires et spéciaux
              </li>
              <li className="flex items-center text-yellow-700">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Des jackpots attractifs et des gains garantis
              </li>
              <li className="flex items-center text-yellow-700">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Un système de paiement sécurisé et rapide
              </li>
              <li className="flex items-center text-yellow-700">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Un réseau d'agents pour vous servir partout
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}