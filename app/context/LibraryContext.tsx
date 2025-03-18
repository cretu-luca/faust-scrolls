'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface LibraryEntry {
  title: string;
  author: string;
  domain: string;
  citations: string;
  yearOfPublication: string;
}

interface LibraryContextType {
  entries: LibraryEntry[];
  addEntry: (entry: LibraryEntry) => void;
  updateEntry: (index: number, entry: LibraryEntry) => void;
  deleteEntry: (index: number) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<LibraryEntry[]>([
    {
      title: "The Metamorphosis of Prime Intellect",
      author: "Roger Williams",
      domain: "Science Fiction",
      citations: "1247",
      yearOfPublication: "1994"
    },
    {
      title: "Principles of Quantum Mechanics",
      author: "Paul Dirac",
      domain: "Physics",
      citations: "15783",
      yearOfPublication: "1930"
    },
    {
      title: "The Alchemist",
      author: "Paulo Coelho",
      domain: "Philosophy",
      citations: "8942",
      yearOfPublication: "1988"
    },
    {
      title: "Structure and Interpretation of Computer Programs",
      author: "Harold Abelson",
      domain: "Computer Science",
      citations: "6721",
      yearOfPublication: "1985"
    },
    {
      title: "The Book of Symbols",
      author: "Carl Jung",
      domain: "Psychology",
      citations: "4532",
      yearOfPublication: "1968"
    }
  ]);

  const addEntry = (entry: LibraryEntry) => {
    setEntries((prevEntries) => [...prevEntries, entry]);
  };

  const updateEntry = (index: number, entry: LibraryEntry) => {
    setEntries((prevEntries) => {
      const newEntries = [...prevEntries];
      newEntries[index] = entry;
      return newEntries;
    });
  };

  const deleteEntry = (index: number) => {
    setEntries((prevEntries) => {
      const newEntries = [...prevEntries];
      newEntries.splice(index, 1);
      return newEntries;
    });
  };

  return (
    <LibraryContext.Provider value={{ entries, addEntry, updateEntry, deleteEntry }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
} 