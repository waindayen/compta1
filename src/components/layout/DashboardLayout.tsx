import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../AdminSidebar';
import DashboardSidebar from './DashboardSidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';
import MobileNavigation from './MobileNavigation';
import { Menu } from 'lucide-react';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBetSlip, setShowBetSlip] = useState(false);
  const { userData } = useAuth();
  const isAdmin = userData?.role === 'adminuser';

  // Sélectionner le bon Sidebar en fonction du rôle
  const SidebarComponent = isAdmin ? AdminSidebar : DashboardSidebar;
  
  const handleToggleBetSlip = () => {
    setShowBetSlip(!showBetSlip);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onToggleBetSlip={handleToggleBetSlip} showBetSlip={showBetSlip} />
      
      {/* Bouton Menu Hamburger - Visible uniquement sur mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-3 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white"
        aria-label="Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Menu Mobile */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className="flex">
        <SidebarComponent />
        <div className="flex-1 lg:ml-64 pt-16 pb-20">
          <Outlet />
        </div>
      </div>

      {/* Navigation mobile unifiée */}
      <MobileNavigation />
    </div>
  );
}