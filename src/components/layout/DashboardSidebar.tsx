import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, ChevronDown } from 'lucide-react';
import Logo from './Logo';
import { agentMenuItems } from '../../config/agentMenuItems';
import { staffMenuItems } from '../../config/staffMenuItems';
import { adminMenuItems } from '../../config/adminMenuItems';
import { useManagerMenuItems } from '../../hooks/useManagerMenuItems';

export default function DashboardSidebar() {
  const { logout, userData } = useAuth();
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const { menuItems: managerMenuItems, loading: managerMenuLoading } = useManagerMenuItems();

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

  const menuItems = getMenuItems();

  // Afficher un loader si les menus des managers sont en cours de chargement
  if (userData?.role === 'manageruser' && managerMenuLoading) {
    return (
      <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
        <div className="p-4 border-b">
          <Logo />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
      <div className="p-4 border-b">
        <Logo />
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
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

      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}