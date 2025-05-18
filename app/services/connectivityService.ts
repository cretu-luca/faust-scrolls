import { create } from 'zustand';
import { memoryStorageService } from './memoryStorageService';

// Use a full URL to avoid CORS issues
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SERVER_HEALTH_ENDPOINT = '/health';
const PING_INTERVAL = 10000;

interface ConnectivityState {
  isOnline: boolean;
  isServerAvailable: boolean;
  lastChecked: Date | null;
  setOnline: (status: boolean) => void;
  setServerAvailable: (status: boolean) => void;
  checkConnectivity: () => Promise<void>;
}

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isServerAvailable: true, // Always assume server is available initially
  lastChecked: null,
  
  setOnline: (status: boolean) => {
    set({ isOnline: status });
    if (!status) {
      ensureMemoryData();
    }
  },
  
  setServerAvailable: (status: boolean) => {
    console.log(`Setting server availability to: ${status}`);
    set({ 
      isServerAvailable: status,
      lastChecked: new Date() 
    });
    if (!status) {
      ensureMemoryData();
    }
  },
  
  checkConnectivity: async () => {
    const { isOnline } = get();
    
    if (!isOnline) {
      set({ isServerAvailable: false });
      ensureMemoryData();
      return;
    }
    
    try {
      console.log(`Checking connectivity to ${API_BASE_URL}${SERVER_HEALTH_ENDPOINT}`);
      const response = await fetch(`${API_BASE_URL}${SERVER_HEALTH_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        cache: 'no-store',
        // Use a longer timeout
        signal: AbortSignal.timeout(10000),
      });
      
      const serverAvailable = response.ok;
      console.log(`Server health check result: ${serverAvailable ? 'Available' : 'Unavailable'}`);
      
      set({ 
        isServerAvailable: serverAvailable,
        lastChecked: new Date()
      });
      
      if (!serverAvailable) {
        ensureMemoryData();
      }
    } catch (error) {
      console.error('Server health check failed:', error);
      
      // Always assume server is available if the health check fails due to CORS
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        console.log('CORS error detected, assuming server is available');
        set({ 
          isServerAvailable: true,
          lastChecked: new Date()
        });
        return;
      }
      
      set({ 
        isServerAvailable: false,
        lastChecked: new Date()
      });
      
      ensureMemoryData();
    }
  }
}));

const ensureMemoryData = () => {
  if (typeof window === 'undefined') return;
  
  try {
    memoryStorageService.initializeIfEmpty();
    console.log('Memory storage initialized for offline use');
  } catch (error) {
    console.error('Failed to initialize memory storage:', error);
  }
};

export const initConnectivityListeners = () => {
  if (typeof window === 'undefined') return;
  
  const { setOnline, checkConnectivity } = useConnectivityStore.getState();
  
  window.addEventListener('online', () => {
    setOnline(true);
    checkConnectivity();
  });
  
  window.addEventListener('offline', () => {
    setOnline(false);
  });
  
  checkConnectivity();
  
  ensureMemoryData();
  
  const intervalId = setInterval(checkConnectivity, PING_INTERVAL);
  
  return () => {
    clearInterval(intervalId);
    window.removeEventListener('online', () => setOnline(true));
    window.removeEventListener('offline', () => setOnline(false));
  };
};

export const shouldUseLocalStorage = (): boolean => {
  const { isOnline, isServerAvailable } = useConnectivityStore.getState();
  
  // If explicitly set to offline by the application, use local storage
  if (!isOnline) {
    return true;
  }
  
  // If server availability is unknown or set to available, don't use local storage
  return !isServerAvailable;
}; 