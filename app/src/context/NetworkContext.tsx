import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { checkInternetConnectivity } from '../utils/networkUtils';

interface NetworkContextType {
  isConnected: boolean;
  isChecking: boolean;
  checkConnection: () => Promise<boolean>;
  setManualOffline: (offline: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isChecking: false,
  checkConnection: async () => true,
  setManualOffline: () => {},
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const isCheckingRef = useRef<boolean>(false);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (isCheckingRef.current) return isConnected;
    isCheckingRef.current = true;
    setIsChecking(true);

    try {
      const online = await checkInternetConnectivity(3500);
      setIsConnected(online);
      return online;
    } catch {
      setIsConnected(false);
      return false;
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, [isConnected]);

  const setManualOffline = useCallback((offline: boolean) => {
    setIsConnected(!offline);
  }, []);

  useEffect(() => {
    // Initial check on mount
    checkConnection();

    // Browser event listeners for Web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        setIsConnected(true);
        checkConnection();
      };
      const handleOffline = () => {
        setIsConnected(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [checkConnection]);

  // Periodic heartbeat / connectivity check
  useEffect(() => {
    // Poll more frequently if offline (every 8s) to quickly recover; every 25s if online
    const intervalTime = isConnected ? 25000 : 8000;
    const interval = setInterval(() => {
      checkConnection();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isConnected, checkConnection]);

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isChecking,
        checkConnection,
        setManualOffline,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
