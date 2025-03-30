'use client';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import YearChart from '../components/YearChart';
import CitationsChart from '../components/CitationsChart';
import DomainHypergraph from '../components/DomainHypergraph';

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

export default function AddArticle() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [existingArticles, setExistingArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<ArticleInput>({
    title: '',
    authors: '',
    citations: 0,
    year: new Date().getFullYear(),
    journal: '',
    abstract: ''
  });

  // Fetch all articles for the charts
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const data = await api.articles.getAll();
        
        // Convert to the format expected by charts
        const formattedData = data.map(article => ({
          ...article,
          year: article.year.toString(),
          // Convert embeddings if needed
          embeddings: article.embedding || [],
          // Ensure coordinates exist
          coordinates: article.coordinates || { x: 0, y: 0 }
        }));
        
        setExistingArticles(formattedData);
      } catch (error) {
        console.error('Error fetching articles for charts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

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
        
        // Add the article using the API
        const newArticle = await api.articles.add(formData);
        
        // Add the new article to the existing articles for the charts
        setExistingArticles(prev => [
          ...prev, 
          { 
            ...newArticle, 
            year: newArticle.year.toString(),
            embeddings: newArticle.embedding || [],
            coordinates: newArticle.coordinates || { x: Math.random() * 50 - 25, y: Math.random() * 50 - 25 }
          }
        ]);
        
        // Reset form after successful submission
        setFormData({
          title: '',
          authors: '',
          citations: 0,
          year: new Date().getFullYear(),
          journal: '',
          abstract: ''
        });
        
        // Show success message instead of navigating
        setSubmitError('Article added successfully!');
        setTimeout(() => setSubmitError(null), 3000);
      } catch (error) {
        console.error('Error adding article:', error);
        setSubmitError('Failed to add article. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5E5] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Add New Article</h1>
          <button 
            onClick={() => router.push('/')}
            className="bg-[#E5EFFF] text-gray-800 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
          >
            Back to Library
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Form Section */}
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-bold mb-4 text-center text-gray-900">Article Details</h2>
              
              {submitError && (
                <div className={`mb-4 p-3 rounded-md ${
                  submitError.includes('successfully') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
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

              <div className="pt-4 mt-6">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#E5EFFF] text-gray-800 py-2 px-6 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                > 
                  {isSubmitting ? 'Submitting...' : 'Add to library'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Charts Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Library Visualizations</h2>
            
            {isLoading ? (
              <div className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <YearChart entries={existingArticles} />
                  <CitationsChart entries={existingArticles} />
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Article Visualization</h2>
                  <div className="h-[500px]">
                    <DomainHypergraph entries={existingArticles} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}