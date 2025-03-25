'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DomainHypergraph from '../components/DomainHypergraph';
import CitationsChart from '../components/CitationsChart';
import YearChart from '../components/YearChart';
import { useLibrary } from '../context/LibraryContext';

type SortField = 'original' | 'year' | 'citations';
type SortOrder = 'asc' | 'desc';

export default function Visualization() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { entries, isLoading } = useLibrary();
  const [localEntries, setLocalEntries] = useState(entries);

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  const searchQuery = searchParams.get('search') || '';
  const yearFilter = searchParams.get('year') || '';
  const sortField = (searchParams.get('sort') as SortField) || 'original';
  const sortOrder = (searchParams.get('order') as SortOrder) || 'asc';

  const filteredEntries = localEntries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.journal && entry.journal.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesYear = !yearFilter || entry.year.includes(yearFilter);

    return matchesSearch && matchesYear;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'original':
        return 0;
      case 'year':
        comparison = parseInt(a.year) - parseInt(b.year);
        break;
      case 'citations':
        comparison = a.citations - b.citations;
        break;
      default:
        return 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (isLoading) {
    return (
      <div className="p-6 bg-[#FFF5E5] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#FFF5E5] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Article Visualization</h1>
        <button
          onClick={() => router.push('/listAll')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Back to List
        </button>
      </div>

      <DomainHypergraph 
        entries={sortedEntries} 
      />

      <CitationsChart entries={sortedEntries} />
      <YearChart entries={sortedEntries} />
    </div>
  );
} 