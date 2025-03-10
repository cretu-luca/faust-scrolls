'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    domain: '',
    citations: '',
    yearOfPublication: ''
  });
  
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const storedEntries = localStorage.getItem('libraryEntries');
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const updatedEntries = [...entries, formData];
    setEntries(updatedEntries);
    
    localStorage.setItem('libraryEntries', JSON.stringify(updatedEntries));
    
    setFormData({
      title: '',
      author: '',
      domain: '',
      citations: '',
      yearOfPublication: ''
    });
  };

  return (
    <div className="p-6">
      <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
        <div className="text-xl font-bold"> Expanding Faust's Library </div>
        <input 
          type="text" 
          name="title"
          placeholder="Title" 
          value={formData.title}
          onChange={handleChange}
          className="px-3 py-2 border rounded"
        />
        <input 
          type="text" 
          name="author"
          placeholder="Author" 
          value={formData.author}
          onChange={handleChange}
          className="px-3 py-2 border rounded"
        />
        <input 
          type="text" 
          name="domain"
          placeholder="Domain" 
          value={formData.domain}
          onChange={handleChange}
          className="px-3 py-2 border rounded"
        />
        <input 
          type="text" 
          name="citations"
          placeholder="Citations" 
          value={formData.citations}
          onChange={handleChange}
          className="px-3 py-2 border rounded"
        />
        <input 
          type="text" 
          name="yearOfPublication"
          placeholder="Year of publication" 
          value={formData.yearOfPublication}
          onChange={handleChange}
          className="px-3 py-2 border rounded"
        />
        <div className="flex space-x-4">
          <button 
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded"
          > 
            Add to library 
          </button>
          <button 
            type="button"
            onClick={() => router.push('/listAll')}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded"
          >
            View Library
          </button>
        </div>
      </form>
    </div>
  );
}