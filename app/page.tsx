/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "./services/api";
import { Article } from "./types/article";
import { memoryStorageService } from "./services/memoryStorageService";
import { useConnectivityStore, shouldUseLocalStorage } from "./services/connectivityService";
import LoginModal from './components/LoginModal';
import UserMenu from './components/UserMenu';
import { useAuth } from './context/AuthContext';

type SortField = 'original' | 'year' | 'citations';
type SortOrder = 'asc' | 'desc';

const scrollbarStyles = `
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb {
    background-color: #000000;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: #333333;
  }
  html {
    scrollbar-width: thin;
    scrollbar-color: #000000 #f3f4f6;
  }
`;

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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const wsRef = useRef<WebSocket | null>(null);

  const itemsPerPage = 10;

  const removeDuplicateArticles = useCallback((articlesList: Article[]): Article[] => {
    const unique = new Map<string, Article>();
    
    [...articlesList].reverse().forEach(article => {
      const key = `${article.title.toLowerCase()}-${article.authors.toLowerCase()}`;
      if (!unique.has(key)) {
        unique.set(key, article);
      } else {
        console.log(`Found duplicate article: "${article.title}" by ${article.authors}`);
      }
    });
    
    const result = Array.from(unique.values());
    if (articlesList.length !== result.length) {
      console.log(`Removed ${articlesList.length - result.length} duplicate articles`);
    }
    
    return result;
  }, []);

  const ensureLocalData = useCallback(() => {
    memoryStorageService.initializeIfEmpty();
    
    if (articles.length === 0) {
      const memoryArticles = memoryStorageService.getArticles();
      if (memoryArticles.length > 0) {
        setArticles(removeDuplicateArticles(memoryArticles));
        setError(null);
      }
    }
  }, [removeDuplicateArticles]);

  const fetchArticles = useCallback(async (year?: number) => {
    try {
      setIsLoading(true);
      let data: Article[];
      
      console.log(`Fetching articles${year ? ` for year ${year}` : ''}`);
      
      if (year) {
        data = await api.articles.getByYear(year);
      } else {
        data = await api.articles.getAll();
      }
      
      console.log(`Successfully fetched ${data.length} articles from API`);
      
      const uniqueArticles = removeDuplicateArticles(data);
      
      setArticles(uniqueArticles);
      setCurrentPage(1);
      setError(null);
      
      if (uniqueArticles.length > 0) {
        memoryStorageService.saveArticles(uniqueArticles);
      } else {
        console.log("Warning: No articles returned from API");
      }
    } catch (err: any) {
      console.error('Failed to fetch articles:', err);
      
      if (err?.message?.includes('NetworkError') || err?.message?.includes('Failed to fetch')) {
        console.log('Network error detected, trying to use local storage');
        useConnectivityStore.getState().setServerAvailable(false);
      }
      
      if (shouldUseLocalStorage()) {
        try {
          console.log('Using local storage as fallback');
          let localData: Article[];
          if (year) {
            localData = memoryStorageService.getArticlesByYear(year);
          } else {
            localData = memoryStorageService.getArticles();
          }
          
          if (localData.length > 0) {
            console.log(`Found ${localData.length} articles in local storage`);
            setArticles(removeDuplicateArticles(localData));
            setError(null);
          } else {
            setError('No articles available offline.');
          }
        } catch (localErr) {
          console.error('Failed to load from local storage:', localErr);
          setError('Failed to load articles. Please check your connection.');
        }
      } else {
        setError('Failed to load articles. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [removeDuplicateArticles]);

  const syncAndRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      
      setArticles([]);
      
      const pendingOps = memoryStorageService.getPendingOperations();
      const hasPendingOps = pendingOps.length > 0;
      
      if (hasPendingOps) {
        console.log(`Syncing ${pendingOps.length} pending operations`);
        try {
          await api.articles.syncPendingOperations();
          console.log("Synced pending operations successfully");
        } catch (syncError) {
          console.error("Error syncing pending operations:", syncError);
        }
      }
      
      try {
        const serverArticles = await api.articles.getAll();
        console.log(`Retrieved ${serverArticles.length} articles from server`);
        
        const uniqueArticles = removeDuplicateArticles(serverArticles);
        
        setArticles(uniqueArticles);
        setCurrentPage(1);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch articles from server:', error);
        
        const memoryArticles = memoryStorageService.getArticles();
        if (memoryArticles.length > 0) {
          const uniqueArticles = removeDuplicateArticles(memoryArticles);
          setArticles(uniqueArticles);
          setCurrentPage(1);
        } else {
          setError('Failed to load articles. No offline data available.');
        }
      }
    } catch (error) {
      console.error("Failed to sync or refresh data:", error);
      
      const memoryArticles = memoryStorageService.getArticles();
      if (memoryArticles.length > 0) {
        setArticles(removeDuplicateArticles(memoryArticles));
      } else {
        setError('Failed to sync or load articles.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [removeDuplicateArticles]);

  const applySorting = useCallback(async () => {
    try {
      setIsLoading(true);
      if (sortField === 'original') {
        const data = await api.articles.getAll();
        setArticles(data);
      } else {
        const data = await api.articles.getSorted(sortField, sortOrder);
        setArticles(data);
      }
    } catch (err) {
      console.error('Failed to sort articles:', err);
      setError('Failed to sort articles. Please try again later.');
      
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
  }, [sortField, sortOrder]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const ws = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        
        if (message.type === 'new_article') {
          console.log('New article received:', message.data);
          setArticles(prevArticles => {
            const exists = prevArticles.some(article => 
              article.id === message.data.id || 
              article.index === message.data.index ||
              (article.title.toLowerCase() === message.data.title.toLowerCase() && 
               article.authors.toLowerCase() === message.data.authors.toLowerCase())
            );
            
            if (exists) {
              console.log('Article already exists in state, not adding duplicate');
              return prevArticles;
            }
            
            return [...prevArticles, message.data];
          });
        } 
        else if (message.type === 'article_updated') {
          console.log('Article updated:', message.data);
          setArticles(prevArticles => 
            prevArticles.map(article => 
              article.index === message.data.index ? message.data : article
            )
          );
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };
    
    ws.onmessage = handleMessage;
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
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
    const loadData = async () => {
      try {
        setIsLoading(true);
        let data: Article[] = [];
        
        try {
          data = await api.articles.getAll();
        } catch (e) {
          console.error('Error fetching from API:', e);
          // Try using local data if available
          const memoryArticles = memoryStorageService.getArticles();
          if (memoryArticles.length > 0) {
            data = memoryArticles;
          }
        }
        
        const uniqueData = data.filter((article, index, self) => 
          index === self.findIndex(a => a.title === article.title && a.authors === article.authors)
        );
        
        setArticles(uniqueData);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load articles');
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (isOffline) {
      const memoryArticles = memoryStorageService.getArticles();
      if (articles.length === 0 && memoryArticles.length > 0) {
        setArticles(memoryArticles);
      }
    }
  }, [isOffline]);

  useEffect(() => {
    const doSort = async () => {
      if (sortField === 'original') return;
      
      try {
        setIsLoading(true);
        const data = await api.articles.getSorted(sortField, sortOrder);
        setArticles(data);
      } catch (err) {
        console.error('Failed to sort:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    doSort();
  }, [sortField, sortOrder]);

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
      <style jsx global>{scrollbarStyles}</style>
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Article Library</h1>
          <button
            onClick={() => isAuthenticated ? router.push('/add') : setIsLoginModalOpen(true)}
            className={`bg-[#E5EFFF] text-gray-800 px-8 py-4 rounded-lg text-lg font-bold shadow-lg transition-colors transform hover:scale-105 border-2 ${
              isAuthenticated ? 'hover:bg-blue-100 border-blue-200' : 'opacity-60 cursor-not-allowed border-gray-200'
            }`}
            title={isAuthenticated ? undefined : 'Please login to add articles'}
          >
            Add article
          </button>
        </div>
        <div className="flex gap-4">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Login
            </button>
          )}
          <button
            onClick={() => router.push('/all-articles')}
            className="bg-[#E5EFFF] text-gray-800 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
          >
            View All Articles
          </button>
          <button
            onClick={() => router.push('/files')}
            className="bg-[#E5EFFF] text-gray-800 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
          >
            File Management
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
          <div className="bg-white rounded-lg shadow overflow-hidden" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#000000 #f3f4f6'
          }}>
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
                        true
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
                        false
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

          {/* Pagination */}
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
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}