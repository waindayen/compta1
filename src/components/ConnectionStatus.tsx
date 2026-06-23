import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudOff } from 'lucide-react';
import { useConnection } from '../contexts/ConnectionContext';

export default function ConnectionStatus() {
  const { isOnline, lastSync } = useConnection();
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !showMessage) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
        {isOnline ? (
          <>
            <CloudOff className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Mode hors ligne</p>
              <p className="text-xs text-gray-500">
                Dernière synchronisation: {lastSync?.toLocaleTimeString()}
              </p>
            </div>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Connexion perdue</p>
              <p className="text-xs text-gray-500">
                Les données sont chargées depuis le cache
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}