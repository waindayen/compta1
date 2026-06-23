import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardMenu() {
  const navigate = useNavigate();
  const { userData } = useAuth();

  if (!userData) return null;

  const getDashboardPath = () => {
    const role = userData.role.replace('user', '');
    return `/dashboard/${role}`;
  };

  return (
    <button
      onClick={() => navigate(getDashboardPath())}
      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
      aria-label="Tableau de bord"
    >
      <LayoutDashboard className="w-5 h-5" />
      <span className="hidden sm:inline font-medium">Tableau de bord</span>
    </button>
  );
}