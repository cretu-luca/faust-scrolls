'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface FileInfo {
  filename: string;
  size: number;
  url: string;
  uploaded_at: number;
}

export default function Files() {
  const router = useRouter();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/files/list');
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      uploadFile(event.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setSuccessMessage(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${percentComplete}%`);
          setUploadProgress(percentComplete);
        }
      });
      
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.open('POST', 'http://localhost:8000/upload/');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error occurred during upload'));
        };
        
        xhr.onabort = () => {
          reject(new Error('Upload aborted'));
        };
        
        xhr.send(formData);
      });
      
      const result = await uploadPromise;
      
      console.log('Upload complete:', result);
      setSuccessMessage(`File "${result.filename}" uploaded successfully!`);
      
      fetchFiles();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (uploadProgress < 100) {
        setUploadProgress(100);
      }
      
      setIsUploading(false);
      
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
    }
  };

  const deleteFile = async (filename: string) => {
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      try {
        const response = await fetch(`http://localhost:8000/api/files/${filename}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
        }
        
        setSuccessMessage(`File "${filename}" deleted successfully!`);
        
        fetchFiles();
      } catch (error) {
        console.error('Error deleting file:', error);
        setUploadError(`Delete failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isImage = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(ext);
  };

  const isVideo = (filename: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return videoExtensions.includes(ext);
  };

  return (
    <div className="min-h-screen bg-[#FFF5E5] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
          <button 
            onClick={() => router.push('/')}
            className="bg-[#E5EFFF] text-gray-800 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
          >
            Back to Library
          </button>
        </div>
        
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Files</h2>
          
          {uploadError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {uploadError}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {successMessage}
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isUploading}
            />
          </div>
          
          {isUploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}
          
          <p className="mt-4 text-gray-500 text-sm">
            Upload any type of file. Large files (like videos) are supported.
          </p>
        </div>
        
        {/* Files List Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Available Files</h2>
          
          {files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No files uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file) => (
                <div key={file.filename} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-40 bg-gray-100 relative flex items-center justify-center">
                    {isImage(file.filename) ? (
                      <img 
                        src={`http://localhost:8000${file.url}`} 
                        alt={file.filename}
                        className="w-full h-full object-contain" 
                      />
                    ) : isVideo(file.filename) ? (
                      <video 
                        src={`http://localhost:8000${file.url}`}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span className="text-sm mt-2">File</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 truncate" title={file.filename}>
                      {file.filename}
                    </h3>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    <p className="text-xs text-gray-400 mb-3">{formatDate(file.uploaded_at)}</p>
                    
                    <div className="flex space-x-2">
                      <a 
                        href={`http://localhost:8000/download/${file.filename}`}
                        className="bg-[#E5EFFF] text-gray-800 px-3 py-1 rounded text-sm hover:bg-blue-100 transition-colors"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => deleteFile(file.filename)}
                        className="bg-red-50 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 