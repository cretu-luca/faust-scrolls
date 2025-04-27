'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const titleRef = useRef<HTMLHeadingElement>(null);
  const usernameRef = useRef<HTMLLabelElement>(null);
  const passwordRef = useRef<HTMLLabelElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  useEffect(() => {
    if (isOpen) {
      if (titleRef.current) {
        titleRef.current.style.setProperty('color', '#000000', 'important');
        titleRef.current.style.setProperty('opacity', '1', 'important');
        titleRef.current.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
      }
      
      if (usernameRef.current) {
        usernameRef.current.style.setProperty('color', '#000000', 'important');
        usernameRef.current.style.setProperty('opacity', '1', 'important');
        usernameRef.current.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
      }
      
      if (passwordRef.current) {
        passwordRef.current.style.setProperty('color', '#000000', 'important');
        passwordRef.current.style.setProperty('opacity', '1', 'important');
        passwordRef.current.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
      }
    }
  }, [isOpen, isLoginMode]);
  
  const { login, register, user } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      let success;
      
      if (isLoginMode) {
        if (!username || !password) {
          setError('Please enter both username and password');
          setIsLoading(false);
          return;
        }
        
        try {
          success = await login(username, password);
        } catch (loginError) {
          console.error('Login error:', loginError);
          setError('Invalid username or password');
          setIsLoading(false);
          return;
        }
      } else {
        if (!name || !username || !password) {
          setError('Please fill in all fields');
          setIsLoading(false);
          return;
        }
        
        try {
          success = await register(name, username, password);
        } catch (registerError) {
          console.error('Registration error:', registerError);
          setError('Username may already be taken');
          setIsLoading(false);
          return;
        }
      }
      
      if (success) {
        onClose();
      } else {
        setError(isLoginMode ? 'Invalid username or password' : 'Registration failed');
      }
    } catch (err) {
      console.error('Error during authentication:', err);
      setError(isLoginMode ? 'Invalid username or password' : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToMyArticles = () => {
    onClose();
    router.push('/my-articles');
  };
  
  if (!isOpen) return null;
  
  const forceBlackText = {
    color: '#000000',
    WebkitTextFillColor: '#000000',
    textShadow: 'none',
    opacity: 1,
    fontWeight: 500,
  };
  
  return (
    <>
      {/* Backdrop with blur effect */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-[#FFF5E5] rounded-lg p-6 w-full max-w-md shadow-xl pointer-events-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 ref={titleRef} className="text-xl font-medium" style={forceBlackText}>
              {isLoginMode ? 'Login' : 'Create Account'}
            </h2>
            <button
              onClick={onClose}
              className="hover:text-gray-800 transition-colors"
              style={forceBlackText}
            >
              ✕
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-2 bg-red-100 rounded text-sm font-normal" style={forceBlackText}>
              {error}
            </div>
          )}
          
          {user ? (
            <div className="flex flex-col gap-4 mb-4">
              <p className="font-normal" style={forceBlackText}>Welcome, {user.name || user.username}!</p>
              <div className="flex gap-3">
                <button
                  onClick={navigateToMyArticles}
                  className="bg-blue-500 hover:bg-blue-600 font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  style={{ color: 'white !important' }}
                >
                  My Articles
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-200 hover:bg-gray-300 font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  style={forceBlackText}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {!isLoginMode && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={forceBlackText} htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="John Doe"
                    style={forceBlackText}
                  />
                </div>
              )}
              
              <div className="mb-4">
                <label ref={usernameRef} className="block text-sm font-medium mb-2" style={forceBlackText} htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded bg-white font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="username"
                  style={forceBlackText}
                />
              </div>
              
              <div className="mb-6">
                <label ref={passwordRef} className="block text-sm font-medium mb-2" style={forceBlackText} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded bg-white font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                  style={forceBlackText}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600 font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-colors"
                  style={{ color: 'white !important' }}
                >
                  {isLoading ? 'Processing...' : isLoginMode ? 'Sign In' : 'Create Account'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setError('');
                  }}
                  className="text-sm hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 transition-colors font-normal"
                  style={forceBlackText}
                >
                  {isLoginMode ? 'Need an account?' : 'Already have an account?'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default LoginModal; 