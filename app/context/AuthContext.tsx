/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

interface User {
  id: string;
  username: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (name: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  checkIfAdmin: () => Promise<boolean>;
  makeAdmin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const checkIfAdmin = useCallback(async (): Promise<boolean> => {
    if (!token || !user) {
      console.log("No token or user, can't check admin status");
      setIsAdmin(false);
      localStorage.setItem('faustIsAdmin', 'false');
      return false;
    }
    
    // Prevent duplicate calls by checking localStorage first
    const storedIsAdmin = localStorage.getItem('faustIsAdmin');
    if (storedIsAdmin) {
      const isUserAdmin = storedIsAdmin === 'true';
      setIsAdmin(isUserAdmin);
      return isUserAdmin;
    }
    
    try {
      const response = await fetch('https://faust-scrolls-backend.onrender.com/admin_id', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const isUserAdmin = data.is_admin === true;
        
        setIsAdmin(isUserAdmin);
        localStorage.setItem('faustIsAdmin', isUserAdmin ? 'true' : 'false');
        return isUserAdmin;
      }
      
      setIsAdmin(false);
      localStorage.setItem('faustIsAdmin', 'false');
      return false;
    } catch (err) {
      console.error('Failed to check admin status:', err);
      setIsAdmin(false);
      localStorage.setItem('faustIsAdmin', 'false');
      return false;
    }
  }, [token, user]);

  useEffect(() => {
    const storedUser = localStorage.getItem('faustUser');
    const storedToken = localStorage.getItem('faustToken');
    const storedIsAdmin = localStorage.getItem('faustIsAdmin');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        setIsAuthenticated(true);
        setIsAdmin(storedIsAdmin === 'true');
        
        // Only check admin status if it's not already set
        if (!storedIsAdmin && storedToken) {
          checkIfAdmin();
        }
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('faustUser');
        localStorage.removeItem('faustToken');
        localStorage.removeItem('faustIsAdmin');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const tokenResponse = await fetch('https://faust-scrolls-backend.onrender.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      if (!tokenResponse.ok) {
        return false;
      }
      
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      
      const userResponse = await fetch('https://faust-scrolls-backend.onrender.com/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!userResponse.ok) {
        return false;
      }
      
      const userData = await userResponse.json();
      
      localStorage.setItem('faustToken', accessToken);
      localStorage.setItem('faustUser', JSON.stringify(userData));
      
      setToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Check admin status immediately after login
      await checkIfAdmin();
      
      return true;
    } catch (error) {
      return false;
    }
  }, [checkIfAdmin]);

  const register = useCallback(async (name: string, username: string, password: string): Promise<boolean> => {
    try {
      const registerResponse = await fetch('https://faust-scrolls-backend.onrender.com/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, username, password }),
      });
      
      if (!registerResponse.ok) {
        return false;
      }
      
      return login(username, password);
    } catch (error) {
      return false;
    }
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('faustUser');
    localStorage.removeItem('faustToken');
    localStorage.removeItem('faustIsAdmin');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  }, []);

  const makeAdmin = useCallback(async (): Promise<boolean> => {
    if (!token || !user) {
      console.log("No token or user, can't make admin");
      return false;
    }
    
    try {
      console.log("Making request to make_admin endpoint...");
      const response = await fetch('https://faust-scrolls-backend.onrender.com/make_admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Make admin response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Make admin response:", data);
        
        // Recheck admin status
        await checkIfAdmin();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to make user admin:', error);
      return false;
    }
  }, [token, user, checkIfAdmin]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isAuthenticated, 
      isAdmin,
      token,
      checkIfAdmin,
      makeAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 