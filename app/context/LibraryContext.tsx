'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface Entry {
  title: string;
  authors: string;
  journal: string;
  citations: number;
  year: string;
  abstract: string;
  domain?: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

interface LibraryContextType {
  entries: Entry[];
  allEntries: Entry[];
  addEntry: (entry: Entry) => Promise<void>;
  updateEntry: (index: number, updatedEntry: Entry) => Promise<void>;
  deleteEntry: (index: number) => Promise<void>;
  isLoading: boolean;
  totalPages: number;
  totalEntries: number;
}

const ITEMS_PER_PAGE = 5;

const defaultContextValue: LibraryContextType = {
  entries: [],
  allEntries: [],
  addEntry: async () => {},
  updateEntry: async () => {},
  deleteEntry: async () => {},
  isLoading: true,
  totalPages: 0,
  totalEntries: 0
};

const LibraryContext = createContext<LibraryContextType>(defaultContextValue);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const totalEntries = entries.length;
  const totalPages = Math.ceil(totalEntries / ITEMS_PER_PAGE);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch('/data/articles-with-embeddings.json');
        if (!response.ok) throw new Error('Failed to load articles');
        const data = await response.json();
        setEntries(data || []);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const addEntry = async (entry: Entry) => {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      setEntries(prevEntries => [...(prevEntries || []), entry]);
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  };

  const updateEntry = async (index: number, updatedEntry: Entry) => {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      setEntries(prevEntries => {
        if (!prevEntries) return [updatedEntry];
        const newEntries = [...prevEntries];
        newEntries[index] = updatedEntry;
        return newEntries;
      });
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (index: number) => {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      setEntries(prevEntries => {
        if (!prevEntries) return [];
        const newEntries = [...prevEntries];
        newEntries.splice(index, 1);
        return newEntries;
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };

  return (
    <LibraryContext.Provider 
      value={{ 
        entries, 
        allEntries: entries, // allEntries is the same as entries for now
        addEntry, 
        updateEntry, 
        deleteEntry, 
        isLoading,
        totalPages,
        totalEntries
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
} 