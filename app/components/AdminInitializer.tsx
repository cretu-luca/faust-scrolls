'use client';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminInitializer() {
  const { isAuthenticated, checkIfAdmin } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('AdminInitializer: Checking admin status...');
      checkIfAdmin().then(isAdmin => {
        console.log('AdminInitializer: Admin status check result:', isAdmin);
      });
    }
  }, [isAuthenticated, checkIfAdmin]);

  // This component doesn't render anything
  return null;
} 