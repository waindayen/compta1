import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogIn, LogOut, Mail, LayoutDashboard, Trophy } from 'lucide-react';
import Logo from './Logo';
import ConnectionStatus from '../ConnectionStatus';
import { useAuth } from '../../contexts/AuthContext';
import MobileMenu from './MobileMenu';
import ContactModal from '../contact/ContactModal';
import DashboardMenu from '../DashboardMenu';
import HamburgerMenu from '../HamburgerMenu';

interface HeaderProps {
  onToggleBetSlip?: () => void;
  showBetSlip?: boolean;
}

export default function Header({ onToggleBetSlip, showBetSlip }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isApiUser = userData?.role === 'apiuser';
  const isUserOrAgent = userData?.role === 'externaluser' || userData?.role === 'agentuser';

  const handleAuthClick = async () => {
    try {
      if (currentUser) {
        await logout();
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Auth action failed:', error);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentUser ? (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
            ) : (
              <HamburgerMenu />
            )}
            <Logo />
            
            {/* Navigation desktop - only for non-authenticated users */}
            {!currentUser && (
              <nav className="hidden lg:flex items-center space-x-1">
                <Link 
                  to="/" 
                  className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Accueil
                </Link>
                <Link 
                  to="/lotto" 
                  className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Lotto
                </Link>
                <Link 
                  to="/lotto/results" 
                  className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Résultats
                </Link>
                <Link 
                  to="/about" 
                  className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  À propos
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus />
            {currentUser && <DashboardMenu />}
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="hidden md:flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <Mail className="w-6 h-6" />
              <span className="font-medium">Contact</span>
            </button>
            <button
              onClick={handleAuthClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title={currentUser ? "Se déconnecter" : "Se connecter"}
            >
              {currentUser ? <LogOut className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Menu Mobile - only for authenticated users */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </>
  );
}