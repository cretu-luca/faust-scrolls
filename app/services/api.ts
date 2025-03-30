import { Article } from '../types/article';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    // Try to parse the message if it's JSON
    let errorMessage = message;
    try {
      const parsed = JSON.parse(message);
      if (parsed.detail) {
        errorMessage = parsed.detail;
      }
    } catch (e) {
      // If parsing fails, just use the original message
    }
    
    super(errorMessage);
    this.name = 'APIError';
  }
}

export const api = {
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Fetching from: ${url}`, options);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        
        // Log additional debugging information
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
      throw error;
    }
  },

  articles: {
    async getAll(): Promise<Article[]> {
      return api.fetch<Article[]>('/all_articles');
    },

    async getSorted(sortBy: string, order: string): Promise<Article[]> {
      return api.fetch<Article[]>(`/sorted_articles?sort_by=${sortBy}&order=${order}`);
    },

    async getByYear(year: number): Promise<Article[]> {
      return api.fetch<Article[]>(`/articles_by_year?year=${year}`);
    }, 

    async getByIndex(index: number): Promise<Article> {
      // Get article by its index property, not position in the list
      return api.fetch<Article>(`/article/${index}`);
    },

    async add(article: {
      title: string;
      authors: string;
      journal: string;
      citations: number;
      year: number;
      abstract: string;
    }): Promise<Article> {
      return api.fetch<Article>('/add_article', {
        method: 'POST',
        body: JSON.stringify(article),
      });
    },

    async update(articleId: string, article: {
      title: string;
      authors: string;
      journal: string;
      citations: number;
      year: number;
      abstract: string;
    }): Promise<Article> {
      console.log(`Updating article with ID/index: ${articleId}`, article);
      return api.fetch<Article>(`/articles/${articleId}`, {
        method: 'PUT',
        body: JSON.stringify(article),
      });
    },

    async delete(articleId: string): Promise<{message: string}> {
      return api.fetch<{message: string}>(`/articles/${articleId}`, {
        method: 'DELETE',
      });
    },

    async search(query: string): Promise<Article[]> {
      return api.fetch<Article[]>(`/search?query=${encodeURIComponent(query)}`);
    }
  }
};