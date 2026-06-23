import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { userData } = useAuth();

  if (!userData || !allowedRoles.includes(userData.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}