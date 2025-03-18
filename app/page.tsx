  'use client';
  import { useState, ChangeEvent, FormEvent } from 'react';
  import { useRouter } from 'next/navigation';
  import { useLibrary } from './context/LibraryContext';

  interface LibraryEntry {
    title: string;
    author: string;
    domain: string;
    citations: string;
    yearOfPublication: string;
  }

  interface ValidationErrors {
    citations?: string;
    yearOfPublication?: string;
  }

  export default function Home() {
    const router = useRouter();
    const { addEntry } = useLibrary();
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    const [formData, setFormData] = useState<LibraryEntry>({
      title: '',
      author: '',
      domain: '',
      citations: '',
      yearOfPublication: ''
    });

    const validateForm = (): boolean => {
      const errors: ValidationErrors = {};

      if (!/^\d+$/.test(formData.citations)) {
        errors.citations = 'Citations must be a valid integer';
      }

      if (!/^\d+$/.test(formData.yearOfPublication)) {
        errors.yearOfPublication = 'Year must be a valid integer';
      } else {
        const year = parseInt(formData.yearOfPublication);
        if (year < 0 || year > new Date().getFullYear()) {
          errors.yearOfPublication = 'Please enter a valid year';
        }
      }

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value
      });
      
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
          author: '',
          domain: '',
          citations: '',
          yearOfPublication: ''
        });
        setValidationErrors({});
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5E5]">
        <div className="w-full max-w-xl p-8 bg-white rounded-lg shadow-md">
          <form className="max-w-md mx-auto" onSubmit={handleSubmit}>
            <h1 className="text-2xl font-bold text-center mb-6 text-black">Expanding Faust's Library</h1>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="w-32 text-right font-medium text-gray-700">Title</label>
                <input 
                  type="text" 
                  name="title"
                  placeholder="Enter title" 
                  value={formData.title}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded text-gray-900 font-joan"
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 text-right font-medium text-gray-700">Author</label>
                <input 
                  type="text" 
                  name="author"
                  placeholder="Enter author" 
                  value={formData.author}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded text-gray-900 font-joan"
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 text-right font-medium text-gray-700">Domain</label>
                <input 
                  type="text" 
                  name="domain"
                  placeholder="Enter domain" 
                  value={formData.domain}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded text-gray-900 font-joan"
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 text-right font-medium text-gray-700">Citations</label>
                <div className="flex-1">
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
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 text-right font-medium text-gray-700">Year</label>
                <div className="flex-1">
                  <input 
                    type="text" 
                    name="yearOfPublication"
                    placeholder="Enter year of publication" 
                    value={formData.yearOfPublication}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded text-gray-900 font-joan ${
                      validationErrors.yearOfPublication ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {validationErrors.yearOfPublication && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.yearOfPublication}</p>
                  )}
                </div>
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
    );
  }