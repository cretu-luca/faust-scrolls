'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnectivityStore, initConnectivityListeners, shouldUseLocalStorage } from '../services/connectivityService';
import { api } from '../services/api';
import { memoryStorageService } from '../services/memoryStorageService';

const OfflineStatus = () => {
  const { isOnline, isServerAvailable } = useConnectivityStore();
  const [mountedState, setMountedState] = useState<{isOnline: boolean, isServerAvailable: boolean} | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const checkLocalData = useCallback(() => {
    const articles = memoryStorageService.getArticles();
    setHasLocalData(articles.length > 0);

    if (shouldUseLocalStorage() && articles.length === 0) {
      memoryStorageService.initializeIfEmpty();
      setHasLocalData(memoryStorageService.getArticles().length > 0);
    }
  }, []);

  const syncPendingOperations = useCallback(async () => {
    try {
      setSyncing(true);
      await api.articles.syncPendingOperations();
      setSyncing(false);
      
      checkLocalData();
    } catch (error) {
      console.error('Failed to sync pending operations:', error);
      setSyncing(false);
    }
  }, [checkLocalData]);

  useEffect(() => {
    const cleanup = initConnectivityListeners();
    
    setMountedState({
      isOnline: useConnectivityStore.getState().isOnline,
      isServerAvailable: useConnectivityStore.getState().isServerAvailable
    });

    checkLocalData();
    
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [checkLocalData]);

  useEffect(() => {
    if (!mountedState) return;
    
    const prevState = mountedState;
    const currentIsOnline = useConnectivityStore.getState().isOnline;
    const currentIsServerAvailable = useConnectivityStore.getState().isServerAvailable;
    
    const wasOffline = !prevState.isOnline || !prevState.isServerAvailable;
    const isNowOnline = currentIsOnline && currentIsServerAvailable;
    
    if (wasOffline && isNowOnline && !syncing) {
      syncPendingOperations();
    }

    if (!wasOffline && !isNowOnline) {
      checkLocalData();
      setIsVisible(true);
    }
  }, [isOnline, isServerAvailable, mountedState, syncing, syncPendingOperations, checkLocalData]);

  if (mountedState === null) {
    return null;
  }

  const isOffline = !mountedState.isOnline;
  const isServerDown = !mountedState.isServerAvailable;
  const isOfflineMode = isOffline || isServerDown;
  
  if (!isOfflineMode && !syncing) {
    return null;
  }

  const getNotificationContent = () => {
    if (syncing) {
      return {
        icon: (
          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        ),
        message: "Syncing offline changes..."
      };
    } else if (!hasLocalData && isOfflineMode) {
      return {
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        message: "No offline data available. Please reconnect to view articles."
      };
    } else if (isOffline) {
      return {
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        ),
        message: "Network connection lost. Working in offline mode."
      };
    } else if (isServerDown) {
      return {
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        ),
        message: "Server unavailable. Working in offline mode."
      };
    }
    
    return { icon: null, message: "" };
  };

  const { icon, message } = getNotificationContent();
  const bgColor = syncing ? 'bg-blue-200' : !hasLocalData ? 'bg-orange-200' : 'bg-red-200';
  
  const animationClasses = isVisible ? 'slide-in-down attention-flash' : 'opacity-0';

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div 
        className={`${bgColor} text-black font-bold p-2 shadow-md ${animationClasses}`}
      >
        <div className="flex items-center justify-center">
          {icon}
          <span className="text-gray-900">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default OfflineStatus; 