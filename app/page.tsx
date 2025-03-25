'use client';
import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLibrary } from './context/LibraryContext';

interface ValidationErrors {
  citations?: string;
  year?: string;
}

interface Entry {
  title: string;
  authors: string;
  journal: string;
  citations: number;
  year: string;
  abstract: string;
  domain?: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

export default function Home() {
  const router = useRouter();
  const { addEntry, entries, isLoading } = useLibrary();
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState<Entry>({
    title: '',
    authors: '',
    domain: '',
    citations: 0,
    year: '',
    journal: '',
    abstract: ''
  });

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!/^\d+$/.test(String(formData.citations))) {
      errors.citations = 'Citations must be a valid integer';
    }

    if (!/^\d+$/.test(formData.year)) {
      errors.year = 'Year must be a valid integer';
    } else {
      const year = parseInt(formData.year);
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
    setFormData((prev: Entry) => ({
      ...prev,
      [name]: name === 'citations' ? (parseInt(value) || 0) : value
    }));
    
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [name]: undefined,
      });
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      addEntry(formData);
      setFormData({
        title: '',
        authors: '',
        domain: '',
        citations: 0,
        year: '',
        journal: '',
        abstract: ''
      });
      setValidationErrors({});
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5E5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E5] flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form className="max-w-md mx-auto" onSubmit={handleSubmit}>
              <h1 className="text-2xl font-bold text-center mb-4 text-black">Expanding Faust&apos;s Library</h1>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input 
                    type="text" 
                    name="title"
                    placeholder="Enter title" 
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded text-gray-900 font-joan"
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
                    className="w-full px-3 py-2 border rounded text-gray-900 font-joan"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                  <input 
                    type="text" 
                    name="domain"
                    placeholder="Enter domain" 
                    value={formData.domain}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded text-gray-900 font-joan"
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
                    className={`w-full px-3 py-2 border rounded text-gray-900 font-joan ${
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
                    className={`w-full px-3 py-2 border rounded text-gray-900 font-joan ${
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
                    className="w-full px-3 py-2 border rounded text-gray-900 font-joan"
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
                    className="w-full px-3 py-2 border rounded text-gray-900 font-joan h-32 resize-none"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4 justify-center pt-4 mt-6">
                <button 
                  type="submit"
                  className="bg-[#E5EFFF] text-gray-800 py-2 px-6 rounded hover:bg-[#d5e3fa] transition-colors font-joan"
                > 
                  Add to library 
                </button>
                <button 
                  type="button"
                  onClick={() => router.push('/listAll')}
                  className="bg-gray-200 text-gray-800 py-2 px-6 rounded hover:bg-gray-300 transition-colors"
                >
                  View Library
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}