'use client';
import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';

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

  const [formData, setFormData] = useState<ArticleInput>({
    title: '',
    authors: '',
    citations: 0,
    year: new Date().getFullYear(),
    journal: '',
    abstract: ''
  });

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
        await api.articles.add(formData);
        
        // Reset form after successful submission
        setFormData({
          title: '',
          authors: '',
          citations: 0,
          year: new Date().getFullYear(),
          journal: '',
          abstract: ''
        });
        
        // Navigate to the article list
        router.push('/');
      } catch (error) {
        console.error('Error adding article:', error);
        setSubmitError('Failed to add article. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5E5] flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Expanding Faust&apos;s Library</h1>
            
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
                {isSubmitting ? 'Submitting...' : 'Add to library'}
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