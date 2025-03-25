"use client";
import React, { useState } from "react";
import { useLibrary } from "../context/LibraryContext";
import { useRouter } from "next/navigation";

type SortField = 'original' | 'year' | 'citations';
type SortOrder = 'asc' | 'desc';

export default function ListAll() {
  const router = useRouter();
  const { entries, isLoading } = useLibrary();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('original');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [yearFilter, setYearFilter] = useState<string>("");
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedEntries = sortedEntries.slice(startIndex, startIndex + itemsPerPage);

  const citationStats = entries.reduce((stats, entry) => ({
    min: Math.min(stats.min, entry.citations),
    max: Math.max(stats.max, entry.citations)
  }), { min: Infinity, max: -Infinity });

  const yearStats = entries.reduce((stats, entry) => ({
    min: Math.min(stats.min, parseInt(entry.year)),
    max: Math.max(stats.max, parseInt(entry.year))
  }), { min: Infinity, max: -Infinity });

  const getGradientColor = (value: number, min: number, max: number) => {
    const normalized = (value - min) / (max - min);
    const r = Math.round(255 * (1 - normalized));
    const g = Math.round(255 * normalized);
    const b = 0;
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
  };

  return (
    <div className="p-6 bg-[#FFF5E5] min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Article Library</h1>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => router.push('/visualization')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            View Visualization
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar with search and filters */}
        <div className="w-1/4 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search & Filters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Search Articles
                </label>
                <input
                  type="text"
                  placeholder="Title, author, abstract, or journal..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900 placeholder-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Filter by Year
                </label>
                <input
                  type="text"
                  placeholder="Enter year..."
                  value={yearFilter}
                  onChange={(e) => {
                    setYearFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900 placeholder-gray-600"
                />
              </div>

              {/* Add sorting controls */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Sort Articles
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="flex-1 p-3 border-2 border-gray-400 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                  >
                    <option value="original">Original Order</option>
                    <option value="year">By Year</option>
                    <option value="citations">By Citations</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 border-2 border-gray-400 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-900"
                    title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Authors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Citations
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedEntries.map((entry, index) => (
                  <tr 
                    key={`${entry.title}-${index}`}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      const actualIndex = sortedEntries.findIndex(e => 
                        e.title === entry.title && 
                        e.authors === entry.authors &&
                        e.year === entry.year &&
                        e.citations === entry.citations
                      );
                      
                      const params = new URLSearchParams();
                      if (searchQuery) params.set('search', searchQuery);
                      if (yearFilter) params.set('year', yearFilter.toString());
                      if (sortField !== 'original') params.set('sort', sortField);
                      if (sortOrder !== 'asc') params.set('order', sortOrder);
                      
                      const queryString = params.toString();
                      router.push(`/details/${actualIndex}${queryString ? `?${queryString}` : ''}`);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{entry.title}</div>
                      <div className="text-sm text-gray-600">{entry.journal}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{entry.authors}</td>
                    <td 
                      className="px-6 py-4 text-sm text-gray-900"
                      style={{
                        backgroundColor: getGradientColor(
                          parseInt(entry.year),
                          yearStats.min,
                          yearStats.max
                        )
                      }}
                    >
                      {entry.year}
                    </td>
                    <td 
                      className="px-6 py-4 text-sm text-gray-900"
                      style={{
                        backgroundColor: getGradientColor(
                          entry.citations,
                          citationStats.min,
                          citationStats.max
                        )
                      }}
                    >
                      {entry.citations.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-900">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedEntries.length)} of {sortedEntries.length} results
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm text-gray-900 disabled:opacity-50 hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-gray-900">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded text-sm text-gray-900 disabled:opacity-50 hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
