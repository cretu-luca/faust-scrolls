'use client';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminInitializer() {
  const { isAuthenticated, checkIfAdmin } = useAuth();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasCheckedRef.current) {
      console.log('AdminInitializer: Checking admin status...');
      hasCheckedRef.current = true;
      checkIfAdmin().then(isAdmin => {
        console.log('AdminInitializer: Admin status check result:', isAdmin);
      });
    }
  }, [isAuthenticated, checkIfAdmin]);

  return null;
} 