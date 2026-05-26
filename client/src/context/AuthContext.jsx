import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder for checking token in local storage
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Use actual backend login API
      const res = await axios.post('/api/auth/login', { email, password });
      
      // If successful, save real user data with ObjectId
      const userData = {
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        roles: (res.data.roles && res.data.roles.length > 0) ? res.data.roles : (res.data.role ? [res.data.role] : ['production']),
        role: res.data.role, // keeping for backward compatibility if needed elsewhere
        token: res.data.token
      };
      
      setUser(userData);
      localStorage.setItem('userInfo', JSON.stringify(userData));
      return true;
    } catch (err) {
      console.error("Login error", err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  const updateUserSession = (userData) => {
    setUser(userData);
    localStorage.setItem('userInfo', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserSession, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
