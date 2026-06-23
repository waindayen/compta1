import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute() {
  const { currentUser, userData, loading, authError } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rediriger vers la page de compte bloqué si l'utilisateur est bloqué ou inactif
  if (authError) {
    return <Navigate to="/account-blocked" replace />;
  }

  // Ne pas rediriger vers la page de changement de mot de passe si :
  // 1. L'utilisateur est un admin
  // 2. L'utilisateur est sur la page de changement de mot de passe
  // 3. L'utilisateur est dans le dashboard admin
  if (userData?.isFirstLogin && 
      location.pathname !== '/change-password' && 
      userData.role !== 'adminuser' &&
      !location.pathname.startsWith('/dashboard/admin')) {
    return <Navigate to="/change-password" replace />;
  }

  // Si nous sommes à la racine du dashboard ou si le rôle ne correspond pas au chemin
  if (userData?.role) {
    const rolePath = userData.role.replace('user', '');
    const currentPath = location.pathname.split('/')[2]; // Obtient la partie du rôle dans l'URL

    if (location.pathname === '/dashboard' || (currentPath && currentPath !== rolePath)) {
      return <Navigate to={`/dashboard/${rolePath}`} replace />;
    }
  }

  return <Outlet />;
}