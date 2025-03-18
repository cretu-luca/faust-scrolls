"use client";
import React, { useState, useMemo } from "react";
import { useLibrary } from "../context/LibraryContext";
import { useRouter } from "next/navigation";

export default function ListAll() {
  const { entries } = useLibrary();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [yearRange, setYearRange] = useState({
    min: "",
    max: "",
  });

  const uniqueDomains = useMemo(() => {
    const domains = new Set(entries.map(entry => entry.domain));
    return Array.from(domains).sort();
  }, [entries]);

  const yearBounds = useMemo(() => {
    if (entries.length === 0) return { min: 0, max: new Date().getFullYear() };
    const years = entries.map(entry => parseInt(entry.yearOfPublication));
    return {
      min: Math.min(...years),
      max: Math.max(...years)
    };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const searchMatch = searchQuery === "" || 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      const domainMatch = selectedDomain === "" || entry.domain === selectedDomain;
      const year = parseInt(entry.yearOfPublication);
      const yearMinMatch = yearRange.min === "" || year >= parseInt(yearRange.min);
      const yearMaxMatch = yearRange.max === "" || year <= parseInt(yearRange.max);

      return searchMatch && domainMatch && yearMinMatch && yearMaxMatch;
    });
  }, [entries, searchQuery, selectedDomain, yearRange]);

  const handleYearRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setYearRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-6 bg-[#FFF5E5] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Faust's Library Entries</h1>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors font-joan"
        >
          <span>←</span> Back to Add Entry
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 mb-6 space-y-4">
        <h2 className="text-lg font-semibold text-black mb-2">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by Title or Author
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-500 font-joan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Domain
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-gray-900 font-joan"
            >
              <option value="">All Domains</option>
              {uniqueDomains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Year
            </label>
            <input
              type="number"
              name="min"
              value={yearRange.min}
              onChange={handleYearRangeChange}
              placeholder={yearBounds.min.toString()}
              min={yearBounds.min}
              max={yearBounds.max}
              className="w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-500 font-joan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Year
            </label>
            <input
              type="number"
              name="max"
              value={yearRange.max}
              onChange={handleYearRangeChange}
              placeholder={yearBounds.max.toString()}
              min={yearBounds.min}
              max={yearBounds.max}
              className="w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-500 font-joan"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedDomain("");
              setYearRange({ min: "", max: "" });
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {entries.length === 0 ? (
              <p>No entries found in the library.</p>
            ) : (
              <p>No entries match the selected filters.</p>
            )}
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-2">
              Showing {filteredEntries.length} of {entries.length} entries
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white"
                  onClick={() => router.push(`/details/${entries.indexOf(entry)}`)}
                >
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{entry.title}</h3>
                  <p className="text-gray-600"><span className="font-medium">Author:</span> {entry.author}</p>
                  <p className="text-gray-600"><span className="font-medium">Domain:</span> {entry.domain}</p>
                  <p className="text-gray-600"><span className="font-medium">Year:</span> {entry.yearOfPublication}</p>
                  <p className="text-gray-600"><span className="font-medium">Citations:</span> {entry.citations}</p>
                  <p className="text-sm text-blue-600 mt-2 hover:text-blue-800">Click to view details →</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
