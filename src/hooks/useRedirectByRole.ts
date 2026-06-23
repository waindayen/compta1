import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

const roleRoutes: Record<UserRole, string> = {
  externaluser: '/dashboard/external',
  agentuser: '/dashboard/agent',
  staffuser: '/dashboard/staff',
  manageruser: '/dashboard/manager',
  directUser: '/dashboard/direct',
  apiuser: '/dashboard/api',
  adminuser: '/dashboard/admin',
  ucieruser: '/dashboard/ucier'
};

export function useRedirectByRole() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userData?.role) {
      const targetRoute = roleRoutes[userData.role];
      if (targetRoute && location.pathname === '/login') {
        navigate(targetRoute, { replace: true });
      }
    }
  }, [userData, navigate, location]);
}