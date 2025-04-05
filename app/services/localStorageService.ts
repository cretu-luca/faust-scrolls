import { Article } from '../types/article';

const STORAGE_KEY = 'faust-scrolls-articles';
const PENDING_OPERATIONS_KEY = 'faust-scrolls-pending-operations';
const STORAGE_INITIALIZED_KEY = 'faust-scrolls-initialized';

// Type definitions for pending operations
type OperationType = 'ADD' | 'UPDATE' | 'DELETE';

interface PendingOperation {
  type: OperationType;
  id?: string;
  article?: Omit<Article, 'id' | 'index' | 'coordinates' | 'embedding'>;
  timestamp: number;
}

// Sample data for offline mode
const SAMPLE_ARTICLES: Article[] = [
  {
    authors: "John Smith, Jane Doe",
    title: "Introduction to Offline First Applications",
    journal: "Web Development Journal",
    abstract: "This paper introduces the concept of offline-first applications and discusses various strategies for implementing offline support in web applications.",
    year: 2023,
    citations: 45,
    coordinates: { x: 0.1, y: 0.2 },
    index: 1,
    id: "sample-1"
  },
  {
    authors: "Alice Johnson, Bob Brown",
    title: "Local Storage Techniques for Web Applications",
    journal: "Modern JavaScript Monthly",
    abstract: "An overview of different storage mechanisms available in modern browsers, with focus on IndexedDB and localStorage API.",
    year: 2022,
    citations: 32,
    coordinates: { x: 0.3, y: 0.4 },
    index: 2,
    id: "sample-2"
  },
  {
    authors: "David Williams, Sarah Miller",
    title: "Service Workers: The Key to Offline Web Applications",
    journal: "Progressive Web App Digest",
    abstract: "This paper explores how Service Workers can be utilized to create fully functional offline experiences in web applications.",
    year: 2021,
    citations: 78,
    coordinates: { x: 0.5, y: 0.6 },
    index: 3,
    id: "sample-3"
  }
];

export const localStorageService = {
  // Check if storage has been initialized
  isInitialized(): boolean {
    if (typeof window === 'undefined') return false;
    
    return localStorage.getItem(STORAGE_INITIALIZED_KEY) === 'true';
  },
  
  // Initialize storage with sample data if empty
  initializeIfEmpty(): void {
    if (typeof window === 'undefined') return;
    
    // Only initialize if not already initialized
    if (!this.isInitialized()) {
      const articles = this.getArticles();
      
      // If no articles in storage, add sample data
      if (articles.length === 0) {
        this.saveArticles(SAMPLE_ARTICLES);
      }
      
      // Mark as initialized
      localStorage.setItem(STORAGE_INITIALIZED_KEY, 'true');
    }
  },

  // Get all articles from local storage
  getArticles(): Article[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const storedArticles = localStorage.getItem(STORAGE_KEY);
      return storedArticles ? JSON.parse(storedArticles) : [];
    } catch (error) {
      console.error('Error retrieving articles from local storage:', error);
      return [];
    }
  },

  // Save articles to local storage
  saveArticles(articles: Article[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    } catch (error) {
      console.error('Error saving articles to local storage:', error);
    }
  },

  // Add a single article
  addArticle(article: Article): void {
    try {
      const articles = this.getArticles();
      
      // Generate a temporary ID if not present
      if (!article.id) {
        article.id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      
      // Generate a temporary index if not present
      if (article.index === undefined) {
        const maxIndex = articles.length > 0 
          ? articles.reduce((max, current) => 
              current.index > max ? current.index : max, 0)
          : 0;
        article.index = maxIndex + 1;
      }
      
      articles.push(article);
      this.saveArticles(articles);
      this.addPendingOperation('ADD', article);
    } catch (error) {
      console.error('Error adding article to local storage:', error);
    }
  },

  // Update an article
  updateArticle(id: string, articleData: Partial<Article>): void {
    try {
      const articles = this.getArticles();
      const index = articles.findIndex(a => a.id === id);
      
      if (index !== -1) {
        articles[index] = { ...articles[index], ...articleData };
        this.saveArticles(articles);
        this.addPendingOperation('UPDATE', articles[index]);
      }
    } catch (error) {
      console.error('Error updating article in local storage:', error);
    }
  },

  // Delete an article
  deleteArticle(id: string): void {
    try {
      const articles = this.getArticles();
      const filteredArticles = articles.filter(a => a.id !== id);
      
      if (filteredArticles.length < articles.length) {
        this.saveArticles(filteredArticles);
        this.addPendingOperation('DELETE', undefined, id);
      }
    } catch (error) {
      console.error('Error deleting article from local storage:', error);
    }
  },

  // Search articles
  searchArticles(query: string): Article[] {
    try {
      const articles = this.getArticles();
      if (articles.length === 0) return [];
      
      const lowercaseQuery = query.toLowerCase();
      
      return articles.filter(article => 
        article.title.toLowerCase().includes(lowercaseQuery) || 
        article.abstract.toLowerCase().includes(lowercaseQuery) || 
        article.authors.toLowerCase().includes(lowercaseQuery) ||
        article.journal.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching articles in local storage:', error);
      return [];
    }
  },

  // Get articles by year
  getArticlesByYear(year: number): Article[] {
    try {
      const articles = this.getArticles();
      return articles.filter(article => article.year === year);
    } catch (error) {
      console.error('Error filtering articles by year in local storage:', error);
      return [];
    }
  },

  // Get article by index
  getArticleByIndex(index: number): Article | undefined {
    try {
      const articles = this.getArticles();
      return articles.find(article => article.index === index);
    } catch (error) {
      console.error('Error retrieving article by index from local storage:', error);
      return undefined;
    }
  },

  // Get sorted articles
  getSortedArticles(sortBy: string, order: string): Article[] {
    try {
      const articles = this.getArticles();
      if (articles.length === 0) return [];
      
      return [...articles].sort((a, b) => {
        let comparison = 0;
        const aValue = a[sortBy as keyof Article];
        const bValue = b[sortBy as keyof Article];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = Number(aValue) - Number(bValue);
        }
        
        return order === 'asc' ? comparison : -comparison;
      });
    } catch (error) {
      console.error('Error sorting articles in local storage:', error);
      return [];
    }
  },

  // Pending operations management
  getPendingOperations(): PendingOperation[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const storedOperations = localStorage.getItem(PENDING_OPERATIONS_KEY);
      return storedOperations ? JSON.parse(storedOperations) : [];
    } catch (error) {
      console.error('Error retrieving pending operations from local storage:', error);
      return [];
    }
  },

  addPendingOperation(type: OperationType, article?: Article, id?: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const operations = this.getPendingOperations();
      
      // Prepare article data without coordinates and embedding
      let articleData;
      if (article) {
        const { coordinates, embedding, ...rest } = article;
        articleData = rest;
      }
      
      operations.push({
        type,
        id: id || article?.id,
        article: articleData,
        timestamp: Date.now()
      });
      
      localStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error('Error adding pending operation to local storage:', error);
    }
  },

  clearPendingOperations(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(PENDING_OPERATIONS_KEY);
    } catch (error) {
      console.error('Error clearing pending operations from local storage:', error);
    }
  }
}; 