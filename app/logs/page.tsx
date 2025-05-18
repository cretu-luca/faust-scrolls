/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface LogEntry {
  log_id: number;
  user_id: number;
  username: string | null;
  action_type: string;
  at_time: string;
  is_malicious?: boolean;
}

interface MaliciousUser {
  entryid: number;
  userid: number;
  username: string | null;
}

const LogsPage: React.FC = () => {
  const { isAuthenticated, isAdmin, token } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [maliciousUsers, setMaliciousUsers] = useState<MaliciousUser[]>([]);
  const [loadingMalicious, setLoadingMalicious] = useState(false);

  // Add malicious user to database - quietly ignore errors
  const addMaliciousUser = useCallback(async (userId: number) => {
    if (!token) return;
    
    try {
      console.log(`Attempting to add user ${userId} as malicious...`);
      const response = await fetch('http://localhost:8000/add_malicious_user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Successfully added user ${userId} as malicious:`, result);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`Failed to add user ${userId} as malicious. Status: ${response.status}`, errorText);
        return false;
      }
    } catch (err) {
      console.error(`Error adding user ${userId} as malicious:`, err);
      return false;
    }
  }, [token]);

  // Detect if a user has 10 or more requests in the last minute
  const detectMaliciousActivity = useCallback(async (logEntries: LogEntry[]): Promise<LogEntry[]> => {
    console.log(`Processing ${logEntries.length} logs for malicious activity detection...`);
    
    // Sort logs by time (newest first)
    const sortedLogs = [...logEntries].sort((a, b) => 
      new Date(b.at_time).getTime() - new Date(a.at_time).getTime()
    );
    
    if (sortedLogs.length === 0) return [];
    
    // Get current time from the most recent log
    const currentTime = new Date(sortedLogs[0].at_time).getTime();
    console.log(`Reference time for detection: ${new Date(currentTime).toISOString()}`);
    
    // Create a map of users and their request counts within the last minute
    const userRequestCounts: Record<number, number> = {};
    const maliciousUsers = new Set<number>();
    
    // First pass: Count requests in the last minute
    for (const log of sortedLogs) {
      const userId = log.user_id;
      const logTime = new Date(log.at_time).getTime();
      
      // Only consider logs from the last minute (60000 milliseconds)
      if (currentTime - logTime <= 60000) {
        // Initialize counter if needed
        if (!userRequestCounts[userId]) {
          userRequestCounts[userId] = 0;
        }
        
        // Increment counter
        userRequestCounts[userId]++;
      }
    }
    
    console.log('Request counts in the last minute:', userRequestCounts);
    
    // Second pass: Mark users with 10+ requests as malicious
    for (const userId in userRequestCounts) {
      if (userRequestCounts[userId] >= 10) {
        console.log(`Found malicious user ${userId} with ${userRequestCounts[userId]} requests in the last minute`);
        maliciousUsers.add(Number(userId));
        // Add to database
        await addMaliciousUser(Number(userId));
      }
    }
    
    // Mark all logs from malicious users
    console.log(`Detected ${maliciousUsers.size} malicious users:`, [...maliciousUsers]);
    
    return logEntries.map(log => ({
      ...log,
      is_malicious: maliciousUsers.has(log.user_id)
    }));
  }, [addMaliciousUser]);

  // Fetch list of malicious users
  const fetchMaliciousUsers = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoadingMalicious(true);
      const maliciousUserIds = new Set<number>();
      
      // For simplicity, we'll extract malicious users from the logs we already have
      logs.forEach(log => {
        if (log.is_malicious) {
          maliciousUserIds.add(log.user_id);
        }
      });
      
      // Create array of malicious users with their details
      const maliciousUsersList: MaliciousUser[] = Array.from(maliciousUserIds).map(userId => {
        // Find the user's info in logs
        const userLog = logs.find(log => log.user_id === userId);
        return {
          entryid: userId, // Using userId as entryid for simplicity
          userid: userId,
          username: userLog?.username || 'Unknown User'
        };
      });
      
      setMaliciousUsers(maliciousUsersList);
    } catch (err) {
      console.error('Error fetching malicious users:', err);
    } finally {
      setLoadingMalicious(false);
    }
  }, [token, logs]);

  // Handle opening the modal
  const handleOpenModal = useCallback(async () => {
    await fetchMaliciousUsers();
    setShowModal(true);
  }, [fetchMaliciousUsers]);

  // Add debug logging
  useEffect(() => {
    console.log("LogsPage - isAuthenticated:", isAuthenticated);
    console.log("LogsPage - isAdmin:", isAdmin);
    console.log("LogsPage - token exists:", !!token);
  }, [isAuthenticated, isAdmin, token]);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      console.log("LogsPage - Not authenticated, redirecting to home");
      router.push('/');
      return;
    }

    const fetchLogs = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/public_logs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        
        const data = await response.json();
        
        // Process logs to detect malicious activity
        const processedLogs = await detectMaliciousActivity(data.logs);
        setLogs(processedLogs);
        setError(null);
      } catch (err) {
        setError('Failed to load logs. Please try again later.');
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [isAuthenticated, token, router, detectMaliciousActivity]);

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  }, []);

  // Modal component for malicious users
  const MaliciousUsersModal = () => {
    if (!showModal) return null;
    
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Malicious Users</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {loadingMalicious ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : maliciousUsers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600">No malicious users detected.</p>
              </div>
            ) : (
              <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {maliciousUsers.map((user) => (
                      <tr key={user.userid} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{user.userid}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center p-1 mr-2 bg-red-100 text-red-600 rounded-full">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </span>
                            {user.username || 'Unknown User'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                            onClick={() => {
                              setShowModal(false);
                            }}
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            View Logs
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button 
              onClick={() => setShowModal(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">System Activity Logs</h1>
            <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-10 w-10 mb-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium">Loading logs...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">System Activity Logs</h1>
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
              <div className="flex">
                <div className="py-1">
                  <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{error}</p>
                  <p className="text-red-500 text-sm mt-1">Please try again later or contact support.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">System Activity Logs</h1>
            <div className="flex space-x-3">
              <button 
                onClick={handleOpenModal}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Malicious Users
              </button>
            <button 
              onClick={() => router.push('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Back to Home
            </button>
            </div>
          </div>
          
          {logs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 font-medium">No logs available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-blue-200">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
                        </svg>
                        Action
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr 
                      key={log.log_id} 
                      className={`hover:bg-gray-50 transition-colors ${log.is_malicious ? 'bg-red-100' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{log.log_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {log.is_malicious && (
                            <span className="inline-flex items-center justify-center p-1 mr-2 bg-red-600 text-white rounded-full" title="Malicious activity detected">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </span>
                          )}
                        {log.username ? (
                          <span className="font-medium text-gray-700">{log.username} <span className="text-xs text-gray-500 ml-1">({log.user_id})</span></span>
                        ) : (
                          <span className="text-gray-500 italic">Unknown</span>
                        )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 ${
                          log.action_type === 'create' ? 'bg-green-100' :
                          log.action_type === 'read' ? 'bg-blue-100' :
                          log.action_type === 'update' ? 'bg-yellow-100' :
                          log.action_type === 'delete' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          {log.action_type === 'create' && (
                            <svg className="w-4 h-4 mr-1.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                          )}
                          {log.action_type === 'read' && (
                            <svg className="w-4 h-4 mr-1.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                          )}
                          {log.action_type === 'update' && (
                            <svg className="w-4 h-4 mr-1.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          )}
                          {log.action_type === 'delete' && (
                            <svg className="w-4 h-4 mr-1.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          )}
                          {log.action_type.charAt(0).toUpperCase() + log.action_type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(log.at_time)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Render the modal */}
      <MaliciousUsersModal />
    </div>
  );
};

export default LogsPage; 