/* eslint-disable @typescript-eslint/no-unused-vars */

import { Article } from '../types/article';
import { memoryStorageService } from './memoryStorageService';
import { shouldUseLocalStorage, useConnectivityStore } from './connectivityService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    let errorMessage = message;
    try {
      const parsed = JSON.parse(message);
      if (parsed.detail) {
        errorMessage = parsed.detail;
      }
    } catch (e) {
    }
    
    super(errorMessage);
    this.name = 'APIError';
  }
}

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('faustToken');
};

export const api = {
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (shouldUseLocalStorage()) {
      throw new APIError(0, 'Network or server unavailable');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Fetching from: ${url}`, options);
    
    const token = getAuthToken();
    
    const requestHeaders = new Headers(options.headers);
    requestHeaders.set('Content-Type', 'application/json');
    
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: requestHeaders,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        
        if (options.body) {
          try {
            const bodyObj = JSON.parse(options.body as string);
            console.log('Request body:', bodyObj);
          } catch (e) {
            console.log('Request body (raw):', options.body);
          }
        }
        
        throw new APIError(response.status, errorText);
      }

      const data = await response.json();
      console.log(`API Response:`, data);
      return data;
    } catch (error) {
      console.error('API Fetch Error:', error);
      
      if (error instanceof Error && 
         (error.message.includes('Failed to fetch') || 
          error.message.includes('Network request failed'))) {
        useConnectivityStore.getState().setServerAvailable(false);
      }
      
      throw error;
    }
  },

  articles: {
    async getAll(): Promise<Article[]> {
      try {
        return await api.fetch<Article[]>('/all_articles');
      } catch (error) {
        if (shouldUseLocalStorage()) {
          console.log('Using memory storage for getAll articles');
          return memoryStorageService.getArticles();
        }
        throw error;
      }
    },

    async getSorted(sortBy: string, order: string): Promise<Article[]> {
      try {
        return await api.fetch<Article[]>(`/sorted_articles?sort_by=${sortBy}&order=${order}`);
      } catch (error) {
        if (shouldUseLocalStorage()) {
          console.log('Using memory storage for sorted articles');
          return memoryStorageService.getSortedArticles(sortBy, order);
        }
        throw error;
      }
    },

    async getByYear(year: number): Promise<Article[]> {
      try {
        return await api.fetch<Article[]>(`/articles_by_year?year=${year}`);
      } catch (error) {
        if (shouldUseLocalStorage()) {
          console.log('Using memory storage for articles by year');
          return memoryStorageService.getArticlesByYear(year);
        }
        throw error;
      }
    }, 

    async getByIndex(index: number): Promise<Article> {
      try {
        return await api.fetch<Article>(`/article/${index}`);
      } catch (error) {
        if (shouldUseLocalStorage()) {
          console.log('Using memory storage for article by index');
          const article = memoryStorageService.getArticleByIndex(index);
          if (article) {
            return article;
          }
        }
        throw error;
      }
    },

    async add(article: {
      title: string;
      authors: string;
      journal: string;
      citations: number;
      year: number;
      abstract: string;
    }): Promise<Article> {
      try {
        return await api.fetch<Article>('/add_article', {
          method: 'POST',
          body: JSON.stringify(article),
        });
      } catch (error) {
        if (shouldUseLocalStorage()) {
          console.log('Using memory storage to add article');
          const newArticle: Article = {
            ...article,
            coordinates: { x: Math.random(), y: Math.random() },
            index: -1
          };
          memoryStorageService.addArticle(newArticle);
          return newArticle;
        }
        throw error;
      }
    },

    async update(articleId: string, article: {
      title: string;
      authors: string;
      journal: string;
      citations: number;
      year: number;
      abstract: string;
    }): Promise<Article> {
      try {
        console.log(`Updating article with ID/index: ${articleId}`, article);
        return await api.fetch<Article>(`/articles/${articleId}`, {
          method: 'PUT',
          body: JSON.stringify(article),
        });
      } catch (error) {
        if (shouldUseLocalStorage()) {
          console.log('Using memory storage to update article');
          const articles = memoryStorageService.getArticles();
          const existingArticle = articles.find(a => a.id === articleId);
          
          if (existingArticle) {
            const updatedArticle = {
              ...existingArticle,
              ...article
            };
            memoryStorageService.updateArticle(articleId, updatedArticle);
            return updatedArticle;
          }
        }
        throw error;
      }
    },

    async delete(articleId: string): Promise<{message: string}> {
      try {
        return await api.fetch<{message: string}>(`/articles/${articleId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        if (shouldUseLocalStorage()) {
          console.log('Using memory storage to delete article');
          memoryStorageService.deleteArticle(articleId);
          return { message: 'Article deleted (offline mode)' };
        }
        throw error;
      }
    },

    async search(query: string): Promise<Article[]> {
      try {
        return await api.fetch<Article[]>(`/search?query=${encodeURIComponent(query)}`);
      } catch (error) {
        if (shouldUseLocalStorage()) {
          console.log('Using memory storage for search');
          return memoryStorageService.searchArticles(query);
        }
        throw error;
      }
    },

    async syncPendingOperations(): Promise<void> {
      if (shouldUseLocalStorage()) {
        return;
      }
      
      const pendingOperations = memoryStorageService.getPendingOperations();
      
      const memoryArticles = memoryStorageService.getArticles();
      
      let serverArticles: Article[] = [];
      try {
        serverArticles = await api.fetch<Article[]>('/all_articles');
        console.log(`Fetched ${serverArticles.length} articles from server before sync`);
      } catch (error) {
        console.error('Failed to fetch server articles before sync:', error);
        return;
      }
      
      const tempArticles: Article[] = [];
      const nonTempArticles: Article[] = [];
      
      memoryArticles.forEach(article => {
        if (article.id && article.id.startsWith('temp-')) {
          tempArticles.push(article);
        } else {
          nonTempArticles.push(article);
        }
      });
      
      console.log(`Found ${tempArticles.length} temporary articles and ${nonTempArticles.length} regular articles in memory`);
      
      if (pendingOperations.length === 0) {
        memoryStorageService.saveArticles(serverArticles);
        console.log('No pending operations, replaced memory with server articles');
        return;
      }
      
      console.log(`Syncing ${pendingOperations.length} pending operations`);
      
      const tempArticleIds = new Set<string>();
      const tempArticleTitles = new Map<string, string>();
      
      tempArticles.forEach(article => {
        if (article.id && article.title) {
          tempArticleIds.add(article.id);
          tempArticleTitles.set(article.title.toLowerCase(), article.id);
        }
      });

      const duplicateArticles: string[] = [];
      tempArticles.forEach(tempArticle => {
        const exists = serverArticles.some(serverArticle => 
          serverArticle.title.toLowerCase() === tempArticle.title.toLowerCase() &&
          serverArticle.authors.toLowerCase() === tempArticle.authors.toLowerCase()
        );
        
        if (exists && tempArticle.id) {
          console.log(`Found duplicate article "${tempArticle.title}" on server, will skip adding`);
          duplicateArticles.push(tempArticle.id);
        }
      });
      
      const sortedOperations = [...pendingOperations]
        .sort((a, b) => a.timestamp - b.timestamp);
      
      for (const operation of sortedOperations) {
        try {
          switch (operation.type) {
            case 'ADD':
              if (operation.article && operation.id) {
                if (duplicateArticles.includes(operation.id)) {
                  console.log(`Skipping duplicate article operation for ID: ${operation.id}`);
                  continue;
                }
                
                await api.articles.add(operation.article);
              }
              break;
            case 'UPDATE':
              if (operation.id && operation.article) {
                if (!operation.id.startsWith('temp-')) {
                  await api.articles.update(operation.id, operation.article);
                }
              }
              break;
            case 'DELETE':
              if (operation.id) {
                if (!operation.id.startsWith('temp-')) {
                  await api.articles.delete(operation.id);
                }
              }
              break;
          }
        } catch (error) {
          console.error(`Failed to sync operation:`, operation, error);
        }
      }
      
      memoryStorageService.clearPendingOperations();
      
      try {
        const refreshedServerArticles = await api.fetch<Article[]>('/all_articles');
        console.log(`Fetched ${refreshedServerArticles.length} articles from server after sync`);
        
        memoryStorageService.saveArticles(refreshedServerArticles);
        
        console.log('Memory storage now contains only server articles');
      } catch (error) {
        console.error('Failed to fetch server articles after sync:', error);
      }
    }
  }
};