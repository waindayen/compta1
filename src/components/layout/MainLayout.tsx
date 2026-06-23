import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import MobileNavigation from './MobileNavigation';
import { useAuth } from '../../contexts/AuthContext';
import UserMobileNavigation from './UserMobileNavigation';

export default function MainLayout() {
  const { userData, currentUser } = useAuth();
  const location = useLocation();
  const isApiUser = userData?.role === 'apiuser';
  const [showBetSlip, setShowBetSlip] = useState(false);
  
  const handleToggleBetSlip = () => {
    setShowBetSlip(!showBetSlip);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {!isApiUser && (
        <Header 
          onToggleBetSlip={handleToggleBetSlip} 
          showBetSlip={showBetSlip} 
        />
      )}
      
      <div className="pt-16 pb-20 md:pb-0">
        <Outlet />
      </div>

      {/* Show different mobile navigation based on authentication status */}
      {currentUser ? (
        <MobileNavigation />
      ) : (
        <UserMobileNavigation />
      )}
    </div>
  );
}