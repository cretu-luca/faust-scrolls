/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';
import { memoryStorageService } from '../../services/memoryStorageService';
import { shouldUseLocalStorage } from '../../services/connectivityService';

interface ValidationErrors {
  citations?: string;
  year?: string;
}

interface ArticleInput {
  title: string;
  authors: string;
  journal: string;
  citations: number;
  year: number;
  abstract: string;
}

// Most basic approach for Next.js App Router
export default function EditArticle({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isOfflineArticle, setIsOfflineArticle] = useState(false);

  const [formData, setFormData] = useState<ArticleInput>({
    title: '',
    authors: '',
    citations: 0,
    year: new Date().getFullYear(),
    journal: '',
    abstract: ''
  });

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        const articleId = params.id;
        
        const offline = shouldUseLocalStorage();
        setIsOfflineMode(offline);
        
        if (articleId.startsWith('temp-')) {
          setIsOfflineArticle(true);
          
          const memoryArticles = memoryStorageService.getArticles();
          const foundArticle = memoryArticles.find(a => a.id === articleId);
          
          if (foundArticle) {
            setFormData({
              title: foundArticle.title,
              authors: foundArticle.authors,
              journal: foundArticle.journal,
              citations: foundArticle.citations,
              year: foundArticle.year,
              abstract: foundArticle.abstract
            });
            return;
          } else {
            setSubmitError("Article not found in offline storage");
            return;
          }
        }
        
        const index = parseInt(articleId);
        
        if (isNaN(index) || index < 0) {
          setSubmitError("Invalid article ID");
          return;
        }
        
        try {
          console.log("Fetching article with index:", index);
          const article = await api.articles.getByIndex(index);
          console.log("Fetched article for editing:", article);
          
          setFormData({
            title: article.title,
            authors: article.authors,
            journal: article.journal,
            citations: article.citations,
            year: article.year,
            abstract: article.abstract
          });
        } catch (err) {
          if (offline) {
            const memoryArticle = memoryStorageService.getArticleByIndex(index);
            if (memoryArticle) {
              setFormData({
                title: memoryArticle.title,
                authors: memoryArticle.authors,
                journal: memoryArticle.journal,
                citations: memoryArticle.citations,
                year: memoryArticle.year,
                abstract: memoryArticle.abstract
              });
            } else {
              console.error('Failed to fetch article:', err);
              if ((err as any).status === 404) {
                setSubmitError('Article not found');
              } else {
                setSubmitError('Failed to load article. Please try again later.');
              }
            }
          } else {
            console.error('Failed to fetch article:', err);
            if ((err as any).status === 404) {
              setSubmitError('Article not found');
            } else {
              setSubmitError('Failed to load article. Please try again later.');
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [params.id]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!/^\d+$/.test(String(formData.citations))) {
      errors.citations = 'Citations must be a valid integer';
    }

    if (!/^\d+$/.test(String(formData.year))) {
      errors.year = 'Year must be a valid integer';
    } else {
      const year = parseInt(String(formData.year));
      if (year < 0 || year > new Date().getFullYear()) {
        errors.year = 'Please enter a valid year';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'citations' || name === 'year' ? (parseInt(value) || 0) : value
    }));
    
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [name]: undefined,
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (validateForm()) {
      try {
        setIsSubmitting(true);
        
        console.log(`Attempting to update article with ID: ${params.id}`);
        
        await api.articles.update(params.id, formData);
        
        router.push('/');
      } catch (error) {
        console.error('Error updating article:', error);
        
        if (isOfflineMode) {
          try {
            if (params.id.startsWith('temp-')) {
              memoryStorageService.updateArticle(params.id, formData);
            } else {
              const index = parseInt(params.id);
              if (!isNaN(index)) {
                const article = memoryStorageService.getArticleByIndex(index);
                if (article && article.id) {
                  memoryStorageService.updateArticle(article.id, formData);
                } else {
                  throw new Error("Could not find article to update");
                }
              } else {
                throw new Error("Invalid article ID for local update");
              }
            }
            
            router.push('/');
            return;
          } catch (localError) {
            console.error('Error updating article in memory storage:', localError);
            setSubmitError('Failed to update article in offline mode.');
          }
        } else {
          const errorDetail = (error as any)?.message || '';
          
          if (errorDetail.includes('Article with index')) {
            setSubmitError(`The article you're trying to edit (index ${params.id}) could not be found. It may have been deleted or there might be an issue with the index.`);
          } else if (errorDetail.includes('Article with ID')) {
            setSubmitError(`The article with ID ${params.id} could not be found. It may have been deleted.`);
          } else {
            setSubmitError('Failed to update article. Please try again later.');
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF5E5] flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E5] flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-center mb-6">
              <h1 className="text-2xl font-bold text-center text-gray-900">Edit Article</h1>
              {isOfflineArticle && (
                <span className="ml-2 px-2 py-1 bg-red-200 text-black text-xs rounded">Offline</span>
              )}
            </div>
            
            {submitError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {submitError}
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  name="title"
                  placeholder="Enter title" 
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input 
                  type="text" 
                  name="authors"
                  placeholder="Enter author" 
                  value={formData.authors}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Citations</label>
                <input 
                  type="text" 
                  name="citations"
                  placeholder="Enter number of citations" 
                  value={formData.citations}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded text-gray-900 ${
                    validationErrors.citations ? 'border-red-500' : ''
                  }`}
                  required
                />
                {validationErrors.citations && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.citations}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input 
                  type="text" 
                  name="year"
                  placeholder="Enter year of publication" 
                  value={formData.year}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded text-gray-900 ${
                    validationErrors.year ? 'border-red-500' : ''
                  }`}
                  required
                />
                {validationErrors.year && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.year}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
                <input 
                  type="text" 
                  name="journal"
                  placeholder="Enter journal" 
                  value={formData.journal}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abstract</label>
                <textarea 
                  name="abstract"
                  placeholder="Enter abstract" 
                  value={formData.abstract}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded text-gray-900 h-32 resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-4 justify-center pt-4 mt-6">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-[#E5EFFF] text-gray-800 py-2 px-6 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
              > 
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button"
                onClick={() => router.push('/')}
                className="bg-[#E5EFFF] text-gray-800 py-2 px-6 rounded hover:bg-blue-100 transition-colors"
              >
                Back to Library
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 