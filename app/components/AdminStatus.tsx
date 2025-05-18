'use client';
import { useAuth } from '../context/AuthContext';

export default function AdminStatus() {
  const { isAdmin, user, checkIfAdmin, makeAdmin } = useAuth();

  const handleCheckAdmin = async () => {
    const result = await checkIfAdmin();
    alert(`Admin check result: ${result}`);
  };

  const handleMakeAdmin = async () => {
    const result = await makeAdmin();
    alert(`Make admin result: ${result}`);
  };

  return (
    <div className="p-4 border rounded-md bg-yellow-50 mb-4">
      <h2 className="text-lg font-bold mb-2">Admin Status Debug</h2>
      <p>User ID: {user?.id || 'Not logged in'}</p>
      <p>Admin Status: {isAdmin ? 'YES' : 'NO'}</p>
      <div className="mt-2 space-x-2">
        <button 
          onClick={handleCheckAdmin}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Check Admin Status
        </button>
        <button 
          onClick={handleMakeAdmin}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Make Admin
        </button>
      </div>
    </div>
  );
} 