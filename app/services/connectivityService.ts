import { create } from 'zustand';
import { memoryStorageService } from './memoryStorageService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SERVER_HEALTH_ENDPOINT = '/health';
const PING_INTERVAL = 10000; // Check connectivity every 10 seconds

// Network state
interface ConnectivityState {
  isOnline: boolean;
  isServerAvailable: boolean;
  lastChecked: Date | null;
  setOnline: (status: boolean) => void;
  setServerAvailable: (status: boolean) => void;
  checkConnectivity: () => Promise<void>;
}

// Create a store using Zustand for state management
export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isServerAvailable: true, // Optimistic assumption
  lastChecked: null,
  
  setOnline: (status: boolean) => {
    set({ isOnline: status });
    // If going offline, ensure we have memory data
    if (!status) {
      ensureMemoryData();
    }
  },
  
  setServerAvailable: (status: boolean) => {
    set({ 
      isServerAvailable: status,
      lastChecked: new Date() 
    });
    // If server becomes unavailable, ensure we have memory data
    if (!status) {
      ensureMemoryData();
    }
  },
  
  checkConnectivity: async () => {
    const { isOnline } = get();
    
    // Only check server if we're online
    if (!isOnline) {
      set({ isServerAvailable: false });
      ensureMemoryData();
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${SERVER_HEALTH_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        // Short timeout to quickly detect server issues
        signal: AbortSignal.timeout(5000),
      });
      
      const serverAvailable = response.ok;
      
      set({ 
        isServerAvailable: serverAvailable,
        lastChecked: new Date()
      });
      
      // If server is not available, ensure we have memory data
      if (!serverAvailable) {
        ensureMemoryData();
      }
    } catch (error) {
      console.error('Server health check failed:', error);
      set({ 
        isServerAvailable: false,
        lastChecked: new Date()
      });
      
      // Ensure we have memory data since we can't connect
      ensureMemoryData();
    }
  }
}));

// Helper function to ensure we have memory data for offline use
const ensureMemoryData = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Initialize memory storage with sample data if needed
    memoryStorageService.initializeIfEmpty();
    console.log('Memory storage initialized for offline use');
  } catch (error) {
    console.error('Failed to initialize memory storage:', error);
  }
};

// Initialize listeners for browser online/offline events
export const initConnectivityListeners = () => {
  if (typeof window === 'undefined') return;
  
  const { setOnline, checkConnectivity } = useConnectivityStore.getState();
  
  // Event listeners for online/offline status
  window.addEventListener('online', () => {
    setOnline(true);
    checkConnectivity();
  });
  
  window.addEventListener('offline', () => {
    setOnline(false);
  });
  
  // Initial check
  checkConnectivity();
  
  // Also initialize memory storage on startup
  ensureMemoryData();
  
  // Set up periodic checks
  const intervalId = setInterval(checkConnectivity, PING_INTERVAL);
  
  // Clean up function
  return () => {
    clearInterval(intervalId);
    window.removeEventListener('online', () => setOnline(true));
    window.removeEventListener('offline', () => setOnline(false));
  };
};

// Hook to check if we should use memory storage
export const shouldUseLocalStorage = (): boolean => {
  const { isOnline, isServerAvailable } = useConnectivityStore.getState();
  const offline = !isOnline || !isServerAvailable;
  
  // Ensure we have memory data if we're going to use it
  if (offline) {
    ensureMemoryData();
  }
  
  return offline;
}; 