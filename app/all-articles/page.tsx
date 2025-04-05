'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import { Article } from '../types/article';
import { memoryStorageService } from '../services/memoryStorageService';
import { shouldUseLocalStorage } from '../services/connectivityService';

export default function AllArticles() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  
  // For infinite scrolling
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement>(null);
  const articleContainerRef = useRef<HTMLDivElement>(null);
  
  // Toggle for sliding window vs. all articles
  const [useSlidingWindow, setUseSlidingWindow] = useState(true);
  
  // Configuration
  const BATCH_SIZE = 30;  // Increased from 15 to 30 articles per batch
  const WINDOW_SIZE = 100; // Increased from 50 to 100 articles to keep in the DOM
  
  useEffect(() => {
    fetchInitialArticles();
  }, []);
  
  // Initial fetch of all articles
  const fetchInitialArticles = async () => {
    try {
      setIsLoading(true);
      
      // Check if we're offline
      const offline = shouldUseLocalStorage();
      setIsOffline(offline);
      
      let data: Article[];
      
      if (offline) {
        data = memoryStorageService.getArticles();
      } else {
        data = await api.articles.getAll();
      }
      
      console.log(`Total articles fetched: ${data.length}`);
      setArticles(data);
      
      // Load initial batch
      const initialBatch = data.slice(0, BATCH_SIZE);
      setDisplayedArticles(initialBatch);
      setHasMore(data.length > BATCH_SIZE);
      setError(null);
      
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      setError('Failed to load articles. Please try again later.');
      
      // Try memory storage as fallback
      try {
        const memoryData = memoryStorageService.getArticles();
        if (memoryData.length > 0) {
          setArticles(memoryData);
          const initialBatch = memoryData.slice(0, BATCH_SIZE);
          setDisplayedArticles(initialBatch);
          setHasMore(memoryData.length > BATCH_SIZE);
          setError(null);
        }
      } catch (localErr) {
        console.error('Failed to load from memory:', localErr);
      }
      
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load more articles when scrolling
  const loadMoreArticles = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * BATCH_SIZE;
    const endIndex = startIndex + BATCH_SIZE;
    
    console.log(`Loading more articles: page ${nextPage}, range ${startIndex}-${endIndex}, total ${articles.length}`);
    
    if (startIndex >= articles.length) {
      console.log('Reached the end of articles array, no more to load');
      setHasMore(false);
      return;
    }
    
    const newArticles = articles.slice(startIndex, endIndex);
    console.log(`New articles batch length: ${newArticles.length}`);
    
    setDisplayedArticles(prevArticles => {
      let updatedArticles = [...prevArticles, ...newArticles];
      
      // Apply sliding window if we've exceeded the window size
      if (useSlidingWindow && updatedArticles.length > WINDOW_SIZE) {
        // Calculate how many items to remove from the top
        const removedCount = updatedArticles.length - WINDOW_SIZE;
        console.log(`Sliding window threshold reached: total ${updatedArticles.length}, window size ${WINDOW_SIZE}`);
        console.log(`Will remove ${removedCount} articles from the top of the view`);
        
        // Remove articles from the top that are out of view
        updatedArticles = updatedArticles.slice(removedCount);
        
        // Update the page number to reflect our actual position in the full dataset
        const effectiveStartIndex = startIndex - (removedCount * BATCH_SIZE);
        const effectivePage = Math.floor(effectiveStartIndex / BATCH_SIZE) + 1;
        console.log(`Adjusted page number from ${nextPage} to ${effectivePage} after sliding window`);
        
        // This will be executed in next render
        setTimeout(() => setPage(effectivePage), 0);
        
        console.log(`Sliding window applied, removed ${removedCount} articles from top, new length: ${updatedArticles.length}`);
      }
      
      return updatedArticles;
    });
    
    setPage(nextPage);
    setHasMore(endIndex < articles.length);
    console.log(`Updated hasMore: ${endIndex < articles.length}, endIndex: ${endIndex}, total: ${articles.length}`);
  }, [articles, isLoading, hasMore, page, useSlidingWindow]);
  
  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreArticles();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loaderRef, hasMore, loadMoreArticles]);
  
  // Toggle between sliding window and showing all articles
  const toggleSlidingWindow = () => {
    if (useSlidingWindow) {
      // Switch to showing all articles
      setDisplayedArticles(articles);
      setHasMore(false);
    } else {
      // Switch back to sliding window
      const initialBatch = articles.slice(0, BATCH_SIZE);
      setDisplayedArticles(initialBatch);
      setPage(1);
      setHasMore(articles.length > BATCH_SIZE);
    }
    setUseSlidingWindow(!useSlidingWindow);
  };
  
  if (isLoading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF5E5] flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#FFF5E5] p-6">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">All Articles</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push('/')}
              className="bg-[#E5EFFF] text-gray-800 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
            >
              Back to Library
            </button>
            <button
              onClick={toggleSlidingWindow}
              className="bg-[#E5EFFF] text-gray-800 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
            >
              {useSlidingWindow ? 'Show All at Once' : 'Use Sliding Window'}
            </button>
            {isOffline && (
              <span className="px-2 py-1 bg-red-200 text-black text-xs rounded flex items-center">
                Offline Mode
              </span>
            )}
          </div>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {displayedArticles.length} of {articles.length} total articles
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden" ref={articleContainerRef}>
          <div className="space-y-4 p-4">
            {displayedArticles.map((article, index) => (
              <div 
                key={`${article.id || article.index}-${index}`}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  const articleId = article.id?.startsWith('temp-')
                    ? article.id
                    : article.index.toString();
                  router.push(`/details/${articleId}`);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      <span className="mr-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-sm rounded-full">#{article.index}</span>
                      {article.title}
                    </h2>
                    <p className="text-sm text-gray-600">{article.authors}</p>
                    <p className="text-sm text-gray-500">{article.journal}, {article.year}</p>
                  </div>
                  <div className="bg-blue-100 px-2 py-1 rounded text-sm">
                    {article.citations} citations
                  </div>
                </div>
                <p className="mt-2 text-gray-700 line-clamp-2">
                  {article.abstract}
                </p>
              </div>
            ))}
            
            {hasMore && (
              <div ref={loaderRef} className="py-4 flex justify-center">
                <div className="loader h-8 w-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
              </div>
            )}
            
            {!hasMore && articles.length > 0 && (
              <div className="py-4 text-center text-gray-500">
                You've reached the end of the list
              </div>
            )}
            
            {articles.length === 0 && !isLoading && (
              <div className="py-8 text-center text-gray-600">
                No articles available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 