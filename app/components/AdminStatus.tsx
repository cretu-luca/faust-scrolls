'use client';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function AdminStatus() {
  const { isAdmin, user, checkIfAdmin, makeAdmin } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isMaking, setIsMaking] = useState(false);

  const handleCheckAdmin = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    const result = await checkIfAdmin();
    alert(`Admin check result: ${result}`);
    setIsChecking(false);
  };

  const handleMakeAdmin = async () => {
    if (isMaking) return;
    
    setIsMaking(true);
    const result = await makeAdmin();
    alert(`Make admin result: ${result}`);
    setIsMaking(false);
  };

  return (
    <div className="p-4 border rounded-md bg-yellow-50 mb-4">
      <h2 className="text-lg font-bold mb-2">Admin Status Debug</h2>
      <p>User ID: {user?.id || 'Not logged in'}</p>
      <p>Admin Status: {isAdmin ? 'YES' : 'NO'}</p>
      <div className="mt-2 space-x-2">
        <button 
          onClick={handleCheckAdmin}
          disabled={isChecking}
          className={`px-4 py-2 ${isChecking ? 'bg-gray-400' : 'bg-blue-500'} text-white rounded`}
        >
          {isChecking ? 'Checking...' : 'Check Admin Status'}
        </button>
        <button 
          onClick={handleMakeAdmin}
          disabled={isMaking}
          className={`px-4 py-2 ${isMaking ? 'bg-gray-400' : 'bg-green-500'} text-white rounded`}
        >
          {isMaking ? 'Processing...' : 'Make Admin'}
        </button>
      </div>
    </div>
  );
} 