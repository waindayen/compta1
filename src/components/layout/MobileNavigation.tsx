import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Trophy, Wallet, LayoutDashboard, Ticket } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function MobileNavigation() {
  const { currentUser, userData } = useAuth();

  // Ne pas afficher la navigation si l'utilisateur n'est pas connecté
  if (!currentUser) {
    return null;
  }

  // Obtenir le chemin du tableau de bord en fonction du rôle
  const getDashboardPath = () => {
    if (!userData?.role) return '/dashboard';
    
    // Retirer le suffixe 'user' du rôle
    const role = userData.role.replace('user', '');
    
    // Construire le chemin en fonction du rôle
    switch (role) {
      case 'agent':
        return '/dashboard/agent';
      case 'staff':
        return '/dashboard/staff';
      case 'manager':
        return '/dashboard/manager';
      case 'admin':
        return '/dashboard/admin';
      case 'director':
        return '/dashboard/director';
      case 'ucier':
        return '/dashboard/ucier';
      default:
        return '/dashboard/external';
    }
  };

  const isAgentOrStaff = userData?.role === 'agentuser' || userData?.role === 'staffuser';
  const ticketsPath = userData?.role === 'agentuser' 
    ? '/dashboard/agent/lotto-tickets'
    : '/dashboard/staff/lotto-tickets';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className={`grid ${isAgentOrStaff ? 'grid-cols-4' : 'grid-cols-4'} h-16`}>
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
          to={userData?.role === 'agentuser' ? '/dashboard/agent/wallet' : '/dashboard/staff/wallet'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 ${
              isActive ? 'text-blue-600' : 'text-gray-600'
            }`
          }
        >
          <Wallet className="w-6 h-6" />
          <span className="text-xs">Portefeuille</span>
        </NavLink>

        {isAgentOrStaff && (
          <NavLink
            to={ticketsPath}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <Ticket className="w-6 h-6" />
            <span className="text-xs">Tickets</span>
          </NavLink>
        )}

        {!isAgentOrStaff && (
          <NavLink
            to={getDashboardPath()}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-xs">Dashboard</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}