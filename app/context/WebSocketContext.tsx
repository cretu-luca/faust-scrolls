'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Article } from '../types/article';

interface WebSocketContextType {
  webSocket: WebSocket | null;
  isConnected: boolean;
  isGenerating: boolean;
  startGeneration: () => void;
  stopGeneration: () => void;
  lastMessage: string | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  webSocket: null,
  isConnected: false,
  isGenerating: false,
  startGeneration: () => {},
  stopGeneration: () => {},
  lastMessage: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Initialize WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws');
    setWebSocket(ws);

    // Set up event listeners
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
      setIsGenerating(false);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message in context:', message);
        
        if (message.type === 'status') {
          setLastMessage(message.data.message);
          
          if (message.data.message.includes('complete') || 
              message.data.message.includes('stopped')) {
            setIsGenerating(false);
          } else if (message.data.message.includes('Starting')) {
            setIsGenerating(true);
          }
        }
        // We don't process 'new_article' messages here - they are handled in the component
      } catch (error) {
        console.error('Error parsing WebSocket message in context:', error);
      }
    };

    // Clean up on unmount
    return () => {
      ws.close();
    };
  }, []);

  const startGeneration = () => {
    if (webSocket && isConnected && !isGenerating) {
      webSocket.send('start_generation');
      setIsGenerating(true);
    }
  };

  const stopGeneration = () => {
    if (webSocket && isConnected && isGenerating) {
      webSocket.send('stop_generation');
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        webSocket,
        isConnected,
        isGenerating,
        startGeneration,
        stopGeneration,
        lastMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}; 