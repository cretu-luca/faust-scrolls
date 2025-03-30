"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';
import { Article } from '../../types/article';

type Params = { id: string };

export default function Details({ params }: { params: Params | Promise<Params> }) {
  // Use React.use() to unwrap the params promise if needed
  const resolvedParams = params instanceof Promise ? React.use(params) : params;
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        const index = parseInt(resolvedParams.id);
        
        if (isNaN(index) || index < 0) {
          setError("Invalid article ID");
          return;
        }
        
        console.log("Fetching article with index:", index);
        const article = await api.articles.getByIndex(index);
        console.log("Fetched article:", article);
        setArticle(article);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch article:', err);
        if ((err as any).status === 404) {
          setError('Article not found');
        } else {
          setError('Failed to load article. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [resolvedParams.id]);

  const handleEdit = () => {
    if (article) {
      router.push(`/edit/${article.index}`);
    }
  };

  const handleDelete = async () => {
    if (!article) {
      setError('Cannot delete article: Article not found');
      return;
    }

    try {
      setIsDeleting(true);
      await api.articles.delete(article.index.toString());
      router.push('/');
    } catch (err) {
      console.error('Failed to delete article:', err);
      setError('Failed to delete article. Please try again later.');
      setIsDeleting(false);
    }
  };

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

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#FFF5E5] p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="mb-4 bg-[#E5EFFF] text-gray-800 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
          >
            Back to Library
          </button>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Article not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E5] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => router.push('/')}
            className="bg-[#E5EFFF] text-gray-800 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
          >
            Back to Library
          </button>
          <div className="space-x-2">
            <button
              onClick={handleEdit}
              className="bg-[#E5EFFF] text-gray-800 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h1>
          
          <div className="mb-4">
            <p className="text-gray-600">{article.authors}</p>
            <p className="text-gray-600">
              {article.journal} • {article.year} • {article.citations} citations
            </p>
          </div>
          
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Abstract</h2>
            <p className="text-gray-700 whitespace-pre-line">{article.abstract}</p>
          </div>
        </div>
      </div>
    </div>
  );
}