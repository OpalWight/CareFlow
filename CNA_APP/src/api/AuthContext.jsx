import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the AuthContext
const AuthContext = createContext();

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  // On mount, try to load user info if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('http://localhost:3001/oauth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const profileData = await response.json();
          setUser(profileData.user || profileData);
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('authToken');
        }
      } catch (err) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // Login: set token and user
  const login = (newToken, userData) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    setUser(userData || null);
  };

  // Logout: clear token and user
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 