import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Trophy, Info } from 'lucide-react';

export default function UserMobileNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-4 h-16">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 ${
              isActive ? 'text-blue-600' : 'text-gray-600'
            }`
          }
        >
          <Home className="w-6 h-6" />
          <span className="text-xs">Accueil</span>
        </NavLink>

        <NavLink
          to="/lotto"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 ${
              isActive ? 'text-blue-600' : 'text-gray-600'
            }`
          }
        >
          <Trophy className="w-6 h-6" />
          <span className="text-xs">Lotto</span>
        </NavLink>

        <NavLink
          to="/lotto/results"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 ${
              isActive ? 'text-blue-600' : 'text-gray-600'
            }`
          }
        >
          <Trophy className="w-6 h-6" />
          <span className="text-xs">Résultats</span>
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 ${
              isActive ? 'text-blue-600' : 'text-gray-600'
            }`
          }
        >
          <Info className="w-6 h-6" />
          <span className="text-xs">À propos</span>
        </NavLink>
      </div>
    </nav>
  );
}