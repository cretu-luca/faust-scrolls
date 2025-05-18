'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import AdminStatus from './AdminStatus';

const UserMenu: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin, checkIfAdmin, makeAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  
  useEffect(() => {
    console.log("UserMenu - isAdmin:", isAdmin);
    console.log("UserMenu - user:", user);
  }, [isAdmin, user]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };
  
  const handleCheckAdmin = async () => {
    if (isCheckingAdmin) return;
    
    setIsCheckingAdmin(true);
    await checkIfAdmin();
    setIsCheckingAdmin(false);
    setIsOpen(false);
  };
  
  const handleMakeAdmin = async () => {
    await makeAdmin();
    setIsOpen(false);
  };
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center">
        {isAuthenticated && (
          <Link href="/logs" className="mr-4">
            <button className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm">
              Logs
            </button>
          </Link>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 border border-gray-200 hover:bg-gray-50"
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{user.name}</span>
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10">
          <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
            Signed in as <span className="font-semibold">{user.username}</span>
          </div>
          
          <AdminStatus />
          
          <Link 
            href="/logs"
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            View Logs
          </Link>
          
          <button
            onClick={handleCheckAdmin}
            disabled={isCheckingAdmin}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-500"
          >
            {isCheckingAdmin ? 'Checking Admin Status...' : 'Check Admin Status'}
          </button>
          
          <button
            onClick={handleMakeAdmin}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Make Me Admin
          </button>
          
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu; 