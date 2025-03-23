"use client";
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLibrary } from '../../context/LibraryContext';

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

type SortField = 'original' | 'year' | 'citations';
type SortOrder = 'asc' | 'desc';

export default function Details({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const resolvedParams = React.use(params);
  const { entries, updateEntry, deleteEntry, isLoading } = useLibrary();

  const searchQuery = searchParams.get('search') || '';
  const yearFilter = searchParams.get('year') || '';
  const sortField = (searchParams.get('sort') as SortField) || 'original';
  const sortOrder = (searchParams.get('order') as SortOrder) || 'asc';

  const filteredEntries = entries.filter(entry => {
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
  
  const index = parseInt(resolvedParams.id);
  const entry = sortedEntries[index];

  const handleDelete = () => {
    if (!entry) return;
    if (window.confirm('Are you sure you want to delete this article?')) {
  
      const originalIndex = entries.findIndex(e => 
        e.title === entry.title && 
        e.authors === entry.authors &&
        e.year === entry.year &&
        e.citations === entry.citations
      );
      if (originalIndex !== -1) {
        deleteEntry(originalIndex);
      }
      router.push('/listAll');
    }
  };

  const handleUpdate = (updatedEntry: Entry) => {
    if (!entry) return;

    const originalIndex = entries.findIndex(e => 
      e.title === entry.title && 
      e.authors === entry.authors &&
      e.year === entry.year &&
      e.citations === entry.citations
    );
    if (originalIndex !== -1) {
      updateEntry(originalIndex, updatedEntry);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF5E5] p-6">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-[#FFF5E5] p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Article not found
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-[#FFF5E5] p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Article</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedEntry = {
                title: formData.get('title') as string,
                authors: formData.get('authors') as string,
                journal: formData.get('journal') as string,
                year: formData.get('year') as string,
                citations: parseInt(formData.get('citations') as string),
                abstract: formData.get('abstract') as string,
                domain: entry.domain,
                coordinates: entry.coordinates
              };
              handleUpdate(updatedEntry);
            }}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={entry.title}
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2 text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Authors</label>
                  <input
                    type="text"
                    name="authors"
                    defaultValue={entry.authors}
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2 text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Journal</label>
                  <input
                    type="text"
                    name="journal"
                    defaultValue={entry.journal}
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2 text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Year</label>
                  <input
                    type="number"
                    name="year"
                    defaultValue={entry.year}
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2 text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Citations</label>
                  <input
                    type="number"
                    name="citations"
                    defaultValue={entry.citations}
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2 text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Abstract</label>
                  <textarea
                    name="abstract"
                    defaultValue={entry.abstract}
                    required
                    rows={6}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2 text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E5] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => router.back()}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
          <div className="space-x-4">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{entry.title}</h1>
          
          <div className="mb-4">
            <p className="text-gray-600">{entry.authors}</p>
            <p className="text-gray-600">
              {entry.journal} • {entry.year} • {entry.citations} citations
            </p>
          </div>
          
          {entry.domain && (
            <div className="mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {entry.domain}
              </span>
            </div>
          )}
          
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Abstract</h2>
            <p className="text-gray-700 whitespace-pre-line">{entry.abstract}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 