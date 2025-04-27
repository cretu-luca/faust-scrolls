import { Article } from '../types/article';

type OperationType = 'ADD' | 'UPDATE' | 'DELETE';

interface PendingOperation {
  type: OperationType;
  id?: string;
  article?: Omit<Article, 'id' | 'index' | 'coordinates' | 'embedding'>;
  timestamp: number;
}

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

let articleStore: Article[] = [];
let pendingOperations: PendingOperation[] = [];
let isInitialized = false;

export const memoryStorageService = {
  isInitialized(): boolean {
    return isInitialized;
  },
  
  initializeIfEmpty(): void {
    if (!isInitialized) {
      if (articleStore.length === 0) {
        articleStore = [...SAMPLE_ARTICLES];
      }
      isInitialized = true;
    }
  },

  getArticles(): Article[] {
    return [...articleStore];
  },

  saveArticles(articles: Article[]): void {
    articleStore = this.removeDuplicateArticles(articles);
  },

  removeDuplicateArticles(articlesList: Article[]): Article[] {
    const unique = new Map<string, Article>();
    
    [...articlesList].reverse().forEach(article => {
      const key = `${article.title.toLowerCase()}-${article.authors.toLowerCase()}`;
      if (!unique.has(key)) {
        unique.set(key, article);
      }
    });
    
    return Array.from(unique.values());
  },

  addArticle(article: Article): void {
    try {
      if (!article.id) {
        article.id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      
      if (article.index === undefined) {
        const maxIndex = articleStore.length > 0 
          ? articleStore.reduce((max, current) => 
              current.index > max ? current.index : max, 0)
          : 0;
        article.index = maxIndex + 1;
      }
      
      const key = `${article.title.toLowerCase()}-${article.authors.toLowerCase()}`;
      const existingIndex = articleStore.findIndex(a => 
        `${a.title.toLowerCase()}-${a.authors.toLowerCase()}` === key
      );
      
      if (existingIndex >= 0) {
        console.log(`Found existing article with the same title and author: "${article.title}"`);
        articleStore[existingIndex] = { ...article };
        this.addPendingOperation('UPDATE', article);
      } else {
        articleStore.push({ ...article });
        this.addPendingOperation('ADD', article);
      }
    } catch (error) {
      console.error('Error adding article to memory storage:', error);
    }
  },

  updateArticle(id: string, articleData: Partial<Article>): void {
    try {
      const index = articleStore.findIndex(a => a.id === id);
      
      if (index !== -1) {
        articleStore[index] = { ...articleStore[index], ...articleData };
        this.addPendingOperation('UPDATE', articleStore[index]);
      }
    } catch (error) {
      console.error('Error updating article in memory storage:', error);
    }
  },

  deleteArticle(id: string): void {
    try {
      const originalLength = articleStore.length;
      articleStore = articleStore.filter(a => a.id !== id);
      
      if (articleStore.length < originalLength) {
        this.addPendingOperation('DELETE', undefined, id);
      }
    } catch (error) {
      console.error('Error deleting article from memory storage:', error);
    }
  },

  searchArticles(query: string): Article[] {
    try {
      if (articleStore.length === 0) return [];
      
      const lowercaseQuery = query.toLowerCase();
      
      return articleStore.filter(article => 
        article.title.toLowerCase().includes(lowercaseQuery) || 
        article.abstract.toLowerCase().includes(lowercaseQuery) || 
        article.authors.toLowerCase().includes(lowercaseQuery) ||
        article.journal.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching articles in memory storage:', error);
      return [];
    }
  },

  getArticlesByYear(year: number): Article[] {
    try {
      return articleStore.filter(article => article.year === year);
    } catch (error) {
      console.error('Error filtering articles by year in memory storage:', error);
      return [];
    }
  },

  getArticleByIndex(index: number): Article | undefined {
    try {
      return articleStore.find(article => article.index === index);
    } catch (error) {
      console.error('Error retrieving article by index from memory storage:', error);
      return undefined;
    }
  },

  getSortedArticles(sortBy: string, order: string): Article[] {
    try {
      if (articleStore.length === 0) return [];
      
      return [...articleStore].sort((a, b) => {
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
      console.error('Error sorting articles in memory storage:', error);
      return [];
    }
  },

  getPendingOperations(): PendingOperation[] {
    return [...pendingOperations];
  },

  addPendingOperation(type: OperationType, article?: Article, id?: string): void {
    try {
      let articleData;
      if (article) {
        const { coordinates, embedding, ...rest } = article;
        articleData = rest;
      }
      
      pendingOperations.push({
        type,
        id: id || article?.id,
        article: articleData,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error adding pending operation to memory storage:', error);
    }
  },

  clearPendingOperations(): void {
    pendingOperations = [];
  },
  
  removeArticlesByIds(ids: string[]): void {
    try {
      if (ids.length === 0) return;
      
      const originalLength = articleStore.length;
      articleStore = articleStore.filter(article => !ids.includes(article.id as string));
      
      console.log(`Removed ${originalLength - articleStore.length} articles by IDs`);
    } catch (error) {
      console.error('Error removing articles by IDs from memory storage:', error);
    }
  }
}; 