import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, ChevronDown, Home, Trophy, Info, HelpCircle, X } from 'lucide-react';
import Logo from './Logo';
import { agentMenuItems } from '../../config/agentMenuItems';
import { staffMenuItems } from '../../config/staffMenuItems';
import { adminMenuItems } from '../../config/adminMenuItems';
import { useManagerMenuItems } from '../../hooks/useManagerMenuItems';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { logout, userData } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [openSubMenu, setOpenSubMenu] = React.useState<string | null>(null);
  const { menuItems: managerMenuItems, loading: managerMenuLoading } = useManagerMenuItems();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const toggleSubMenu = (label: string) => {
    setOpenSubMenu(openSubMenu === label ? null : label);
  };

  // Sélectionner les éléments de menu en fonction du rôle
  const getMenuItems = () => {
    switch (userData?.role) {
      case 'adminuser':
        return adminMenuItems;
      case 'manageruser':
        return managerMenuItems;
      case 'agentuser':
        return agentMenuItems;
      case 'staffuser':
        return staffMenuItems;
      default:
        return [];
    }
  };

  const menuItems = userData?.role === 'manageruser' && managerMenuLoading ? [] : getMenuItems();
  
  // Menu items for public pages - only shown for non-authenticated users
  const publicMenuItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: Trophy, label: 'Lotto', path: '/lotto' },
    { icon: Trophy, label: 'Résultats Lotto', path: '/lotto/results' },
    { icon: Info, label: 'À propos', path: '/about' },
    { icon: HelpCircle, label: 'FAQ', path: '/faq' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div 
        ref={menuRef}
        className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto"
      >
        <div className="flex flex-col min-h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <Logo />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {/* Public menu items - only for non-authenticated users */}
              {!userData && publicMenuItems.map((item, index) => (
                <NavLink
                  key={`public-${index}`}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
              
              {/* User-specific menu items */}
              {userData && menuItems.map((item, index) => (
                <div key={index}>
                  {item.submenu ? (
                    <>
                      <button
                        onClick={() => toggleSubMenu(item.label)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          openSubMenu === item.label ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {openSubMenu === item.label && (
                        <div className="ml-4 pl-4 border-l border-gray-200 space-y-1 mt-1">
                          {item.submenu.map((subItem, subIndex) => (
                            <NavLink
                              key={subIndex}
                              to={subItem.path}
                              onClick={onClose}
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                                  isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`
                              }
                            >
                              <subItem.icon className="w-4 h-4" />
                              <span className="font-medium text-sm">{subItem.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Footer with logout button if user is logged in */}
          {userData && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}