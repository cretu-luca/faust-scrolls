'use client';
import { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { useParams, useRouter } from 'next/navigation';

interface ValidationErrors {
  citations?: string;
  yearOfPublication?: string;
}

export default function DetailsPage() {
  const { entries, updateEntry, deleteEntry } = useLibrary();
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const entry = entries[id];
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(entry);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  if (!entry) {
    return (
      <div className="p-6">
        <div className="text-red-500">Entry not found</div>
        <button
          onClick={() => router.back()}
          className="mt-4 bg-gray-200 text-gray-800 py-2 px-4 rounded"
        >
          Go back
        </button>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!/^\d+$/.test(editedEntry.citations)) {
      errors.citations = 'Citations must be a valid integer';
    }

    if (!/^\d+$/.test(editedEntry.yearOfPublication)) {
      errors.yearOfPublication = 'Year must be a valid integer';
    } else {
      const year = parseInt(editedEntry.yearOfPublication);
      if (year < 0 || year > new Date().getFullYear()) {
        errors.yearOfPublication = 'Please enter a valid year';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = () => {
    if (validateForm()) {
      updateEntry(id, editedEntry);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      deleteEntry(id);
      router.push('/listAll');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedEntry({
      ...editedEntry,
      [name]: value,
    });
    
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [name]: undefined,
      });
    }
  };

  if (isEditing) {
    return (
      <div className="min-h-screen p-6 bg-[#FFF5E5]">
        <div className="max-w-xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="max-w-md mx-auto">
              <h1 className="text-3xl font-bold mb-6 text-black">Edit Entry</h1>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-right font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={editedEntry.title}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border rounded-md text-gray-900 font-joan"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="w-32 text-right font-medium text-gray-700">Author</label>
                  <input
                    type="text"
                    name="author"
                    value={editedEntry.author}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border rounded-md text-gray-900 font-joan"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="w-32 text-right font-medium text-gray-700">Domain</label>
                  <input
                    type="text"
                    name="domain"
                    value={editedEntry.domain}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border rounded-md text-gray-900 font-joan"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="w-32 text-right font-medium text-gray-700">Citations</label>
                  <div className="flex-1">
                    <input
                      type="text"
                      name="citations"
                      value={editedEntry.citations}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md text-gray-900 font-joan ${
                        validationErrors.citations ? 'border-red-500' : ''
                      }`}
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
                      value={editedEntry.yearOfPublication}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md text-gray-900 font-joan ${
                        validationErrors.yearOfPublication ? 'border-red-500' : ''
                      }`}
                    />
                    {validationErrors.yearOfPublication && (
                      <p className="mt-1 text-sm text-red-500">{validationErrors.yearOfPublication}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-x-4">
                <button
                  onClick={handleUpdate}
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors font-joan"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setValidationErrors({});
                  }}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors font-joan"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[#FFF5E5]">
      <div className="max-w-xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-6 text-black">{entry.title}</h1>
          
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-black">Author</h2>
              <p className="text-gray-600 font-joan">{entry.author}</p>
            </div>
            
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-black">Domain</h2>
              <p className="text-gray-600 font-joan">{entry.domain}</p>
            </div>
            
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-black">Citations</h2>
              <p className="text-gray-600 font-joan">{entry.citations}</p>
            </div>
            
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-black">Year of Publication</h2>
              <p className="text-gray-600 font-joan">{entry.yearOfPublication}</p>
            </div>
          </div>
          
          <div className="mt-6 space-x-4">
            <button
              onClick={() => router.back()}
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors font-joan"
            >
              Back to Library
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors font-joan"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors font-joan"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 