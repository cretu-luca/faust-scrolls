'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Article } from '../types/article';
import { getGradientColor } from '../utils/colorUtils';

export default function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { minYear, maxYear, minCitations, maxCitations } = useMemo(() => {
    if (!articles.length) {
      return { minYear: 0, maxYear: 0, minCitations: 0, maxCitations: 0 };
    }
    
    return {
      minYear: Math.min(...articles.map(a => a.year)),
      maxYear: Math.max(...articles.map(a => a.year)),
      minCitations: Math.min(...articles.map(a => a.citations)),
      maxCitations: Math.max(...articles.map(a => a.citations))
    };
  }, [articles]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const data = await api.articles.getAll();
        setArticles(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch articles:', err);
        setError('Failed to load articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading articles...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">All Articles</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, index) => {
          // Generate colors for year and citations
          const yearColor = getGradientColor(article.year, minYear, maxYear, true);
          const citationsColor = getGradientColor(article.citations, minCitations, maxCitations, false);
          
          return (
            <div key={index} className="border p-4 rounded shadow hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold">{article.title}</h2>
              <p className="text-sm text-gray-600">{article.authors}</p>
              <div className="flex justify-between items-center mt-1">
                {/* Journal with colored year */}
                <p className="text-sm">
                  {article.journal} (
                  <span 
                    className="font-medium px-1 py-0.5 rounded" 
                    style={{ backgroundColor: yearColor, color: article.year > (minYear + maxYear) / 2 ? 'black' : 'white' }}
                  >
                    {article.year}
                  </span>
                  )
                </p>
                
                {/* Citations with color */}
                <p className="text-sm">
                  <span 
                    className="font-medium px-2 py-0.5 rounded" 
                    style={{ backgroundColor: citationsColor, color: article.citations > (minCitations + maxCitations) / 2 ? 'black' : 'white' }}
                  >
                    {article.citations} citations
                  </span>
                </p>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-gray-700">{article.abstract}</p>
            </div>
          );
        })}
      </div>
      
      {articles.length === 0 && !loading && !error && (
        <p className="text-center text-gray-500">No articles found</p>
      )}
    </div>
  );
} 