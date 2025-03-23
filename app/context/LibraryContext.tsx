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
  addEntry: (entry: Entry) => void;
  updateEntry: (index: number, updatedEntry: Entry) => void;
  deleteEntry: (index: number) => void;
  isLoading: boolean;
  totalPages: number;
  totalEntries: number;
}

const ITEMS_PER_PAGE = 5;

const defaultContextValue: LibraryContextType = {
  entries: [],
  allEntries: [],
  addEntry: () => {},
  updateEntry: () => {},
  deleteEntry: () => {},
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

  const addEntry = (entry: Entry) => {
    setEntries(prevEntries => [...(prevEntries || []), entry]);
  };

  const updateEntry = (index: number, updatedEntry: Entry) => {
    setEntries(prevEntries => {
      if (!prevEntries) return [updatedEntry];
      const newEntries = [...prevEntries];
      newEntries[index] = updatedEntry;
      return newEntries;
    });
  };

  const deleteEntry = (index: number) => {
    setEntries(prevEntries => {
      if (!prevEntries) return [];
      const newEntries = [...prevEntries];
      newEntries.splice(index, 1);
      return newEntries;
    });
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