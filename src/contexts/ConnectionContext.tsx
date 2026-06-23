import React, { createContext, useContext, useState, useEffect } from 'react';
import { onConnectivityStateChange, getConnectionStatus } from '../lib/firebase';

interface ConnectionContextType {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  lastSync: Date | null;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(getConnectionStatus());
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = onConnectivityStateChange((online) => {
      setIsOnline(online);
      if (online) {
        setLastSync(new Date());
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ConnectionContext.Provider value={{ isOnline, setIsOnline, lastSync }}>
      {children}
    </ConnectionContext.Provider>
  );
}