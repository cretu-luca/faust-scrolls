"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "./services/api";
import { Article } from "./types/article";
import { memoryStorageService } from "./services/memoryStorageService";
import { useConnectivityStore, shouldUseLocalStorage } from "./services/connectivityService";

type SortField = 'original' | 'year' | 'citations';
type SortOrder = 'asc' | 'desc';

export default function Home() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('original');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [yearFilter, setYearFilter] = useState<string>("");
  const [isOffline, setIsOffline] = useState(false);

  const itemsPerPage = 10;

  // Initialize connectivity monitoring and memory storage
  useEffect(() => {
    // Initialize memory storage with sample data for offline use
    memoryStorageService.initializeIfEmpty();
    
    const unsubscribe = useConnectivityStore.subscribe((state) => {
      const offline = !state.isOnline || !state.isServerAvailable;
      setIsOffline(offline);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchArticles();
  }, []);

  // Effect for handling online/offline transitions
  useEffect(() => {
    // When coming back online, try to sync changes and refresh data
    if (!isOffline) {
      syncAndRefresh();
    } else {
      // When going offline, make sure we have local data
      ensureLocalData();
    }
  }, [isOffline]);

  const ensureLocalData = () => {
    // Initialize memory storage with sample data if needed
    memoryStorageService.initializeIfEmpty();
    
    // If we have no articles loaded but have memory data, load it
    if (articles.length === 0) {
      const memoryArticles = memoryStorageService.getArticles();
      if (memoryArticles.length > 0) {
        setArticles(memoryArticles);
        setError(null);
      }
    }
  };

  const syncAndRefresh = async () => {
    try {
      setIsLoading(true);
      
      // Always clear any existing state first
      setArticles([]);
      
      // 1. Check if we have any pending operations first
      const pendingOps = memoryStorageService.getPendingOperations();
      const hasPendingOps = pendingOps.length > 0;
      
      if (hasPendingOps) {
        // If we have pending operations, sync them first
        console.log(`Syncing ${pendingOps.length} pending operations`);
        await api.articles.syncPendingOperations();
      }
      
      // Always fetch fresh data from server after potentially syncing
      try {
        const serverArticles = await api.articles.getAll();
        console.log(`Retrieved ${serverArticles.length} articles from server`);
        setArticles(serverArticles);
        setCurrentPage(1);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch articles from server:', error);
        
        // If we can't get server data, use memory as fallback
        const memoryArticles = memoryStorageService.getArticles();
        if (memoryArticles.length > 0) {
          setArticles(memoryArticles);
          setCurrentPage(1);
        } else {
          setError('Failed to load articles. No offline data available.');
        }
      }
    } catch (error) {
      console.error("Failed to sync or refresh data:", error);
      
      // If sync failed but we have memory data, show it
      const memoryArticles = memoryStorageService.getArticles();
      if (memoryArticles.length > 0) {
        setArticles(memoryArticles);
      } else {
        setError('Failed to sync or load articles.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sortField !== 'original') {
      applySorting();
    }
  }, [sortField, sortOrder]);

  const applySorting = async () => {
    try {
      setIsLoading(true);
      if (sortField === 'original') {
        await fetchArticles();
      } else {
        const data = await api.articles.getSorted(sortField, sortOrder);
        setArticles(data);
      }
    } catch (err) {
      console.error('Failed to sort articles:', err);
      setError('Failed to sort articles. Please try again later.');
      
      // Try memory storage as fallback
      if (shouldUseLocalStorage()) {
        try {
          const localData = memoryStorageService.getSortedArticles(sortField, sortOrder);
          setArticles(localData);
          setError(null);
        } catch (localErr) {
          console.error('Failed to sort articles from memory storage:', localErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArticles = async (year?: number) => {
    try {
      setIsLoading(true);
      let data: Article[];
      
      if (year) {
        data = await api.articles.getByYear(year);
      } else {
        data = await api.articles.getAll();
      }
      
      setArticles(data);
      setCurrentPage(1);
      setError(null);
      
      // Update memory storage with the latest data
      if (data.length > 0) {
        memoryStorageService.saveArticles(data);
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      
      // If we're offline, try to load from memory storage as fallback
      if (shouldUseLocalStorage()) {
        try {
          let localData: Article[];
          if (year) {
            localData = memoryStorageService.getArticlesByYear(year);
          } else {
            localData = memoryStorageService.getArticles();
          }
          
          if (localData.length > 0) {
            setArticles(localData);
            setCurrentPage(1);
            setError(null);
            setIsOffline(true);
          } else {
            // If no memory data available, show a more helpful error message
            setError('No articles available offline. Please reconnect to network or server.');
          }
        } catch (localErr) {
          console.error('Failed to load articles from memory storage:', localErr);
          setError('Failed to load articles in offline mode. Please reload the page.');
        }
      } else {
        setError('Failed to load articles. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      try {
        setIsLoading(true);
        console.log("Searching for:", searchQuery);
        const data = await api.articles.search(searchQuery);
        setArticles(data);
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to search articles:', err);
        setError('Failed to search articles. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // If search query is empty, fetch all articles
      fetchArticles();
    }
  };

  const handleYearFilterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const yearValue = parseInt(yearFilter);
    if (!isNaN(yearValue)) {
      await fetchArticles(yearValue);
    } else if (yearFilter === "") {
      await fetchArticles();
    }
  };

  const getGradientColor = (value: number, min: number, max: number, inverse: boolean = false) => {
    if (min === max) return { bg: 'rgba(255, 255, 0, 0.3)', text: '#000000' }; 
    
    let percentage = (value - min) / (max - min);
    
    if (inverse) {
      percentage = 1 - percentage;
    }
    
    percentage = Math.max(0, Math.min(1, percentage));
    
    const r = Math.round(255 * (1 - percentage));
    const g = Math.round(255 * percentage);
    const b = 0;
    
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const textColor = brightness > 128 ? '#000000' : '#ffffff';
    
    return { 
      bg: `rgba(${r}, ${g}, ${b}, 0.7)`, 
      text: textColor 
    };
  };

  const yearStats = articles.reduce((stats, article) => ({
    min: Math.min(stats.min, article.year),
    max: Math.max(stats.max, article.year)
  }), { min: Infinity, max: -Infinity });

  const citationStats = articles.reduce((stats, article) => ({
    min: Math.min(stats.min, article.citations),
    max: Math.max(stats.max, article.citations)
  }), { min: Infinity, max: -Infinity });

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

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF5E5] p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(articles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedArticles = articles.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 bg-[#FFF5E5] min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Article Library</h1>
          <button
            onClick={() => router.push('/add')}
            className="bg-[#E5EFFF] text-gray-800 px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:bg-blue-100 transition-colors transform hover:scale-105 border-2 border-blue-200"
          >
            Add article
          </button>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/all-articles')}
            className="bg-[#E5EFFF] text-gray-800 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
          >
            View All Articles
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar with search and filters */}
        <div className="w-1/3 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search & Filters</h2>
            <div className="space-y-4">
              <div>
                <form onSubmit={handleSearchSubmit}>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Search Articles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      placeholder="Title, author, abstract, or journal..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 min-w-[60%] p-3 border-2 border-gray-400 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900 placeholder-gray-600"
                    />
                    <div className="flex gap-1">
                      <button
                        type="submit"
                        disabled={!searchQuery.trim()}
                        className="px-3 py-2 bg-[#E5EFFF] text-gray-800 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        Search
                      </button>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            fetchArticles();
                          }}
                          className="px-3 py-2 bg-[#E5EFFF] text-gray-800 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                          title="Clear search"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              <div>
                <form onSubmit={handleYearFilterSubmit}>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Filter by Year
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      placeholder="Enter year..."
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="flex-1 min-w-[60%] p-3 border-2 border-gray-400 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900 placeholder-gray-600"
                    />
                    <div className="flex gap-1">
                      <button
                        type="submit"
                        className="px-3 py-2 bg-[#E5EFFF] text-gray-800 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Apply
                      </button>
                      {yearFilter && (
                        <button
                          type="button"
                          onClick={() => {
                            setYearFilter("");
                            fetchArticles();
                          }}
                          className="px-3 py-2 bg-[#E5EFFF] text-gray-800 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                          title="Clear year filter"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Add sorting controls */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Sort Articles
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortField}
                    onChange={(e) => {
                      setSortField(e.target.value as SortField);
                      // Clear search and year filters when sorting changes
                      if (searchQuery) setSearchQuery("");
                      if (yearFilter) setYearFilter("");
                    }}
                    className="flex-1 p-3 border-2 border-gray-400 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                  >
                    <option value="original">Original Order</option>
                    <option value="year">By Year</option>
                    <option value="citations">By Citations</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 border-2 border-blue-200 rounded-lg bg-[#E5EFFF] hover:bg-blue-100 text-gray-800"
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
              {displayedArticles.map((article, index) => (
                <tr 
                  key={`${article.title}-${index}`}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    // For temporary offline IDs, use the ID, otherwise use the index
                    const articleId = article.id?.startsWith('temp-') 
                      ? article.id 
                      : article.index.toString();
                    console.log("Navigating to article with ID:", articleId);
                    router.push(`/details/${articleId}`);
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{article.title}</div>
                    <div className="text-sm text-gray-600">{article.journal}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{article.authors}</td>
                  <td 
                    className="px-6 py-4 text-sm font-medium"
                    style={{
                      backgroundColor: getGradientColor(
                        article.year,
                        yearStats.min,
                        yearStats.max,
                        true // Inverse for years (newer = greener)
                      ).bg,
                      color: getGradientColor(
                        article.year,
                        yearStats.min,
                        yearStats.max,
                        true
                      ).text
                    }}
                  >
                    {article.year}
                  </td>
                  <td 
                    className="px-6 py-4 text-sm font-medium"
                    style={{
                      backgroundColor: getGradientColor(
                        article.citations,
                        citationStats.min,
                        citationStats.max,
                        false // Not inverse for citations (more = greener)
                      ).bg,
                      color: getGradientColor(
                        article.citations,
                        citationStats.min,
                        citationStats.max,
                        false
                      ).text
                    }}
                  >
                    {article.citations.toLocaleString()}
                  </td>
                </tr>
              ))}
                {displayedArticles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No articles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - fixed version */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-900">
              Showing {articles.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, articles.length)} of {articles.length} results
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm text-gray-800 bg-[#E5EFFF] disabled:opacity-50 hover:bg-blue-100"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-gray-900">Page {currentPage} of {totalPages || 1}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 border rounded text-sm text-gray-800 bg-[#E5EFFF] disabled:opacity-50 hover:bg-blue-100"
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