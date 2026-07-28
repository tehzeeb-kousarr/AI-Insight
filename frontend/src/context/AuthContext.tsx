import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../services/api';
// import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// MOCK USER FOR DEVELOPMENT
// To re-enable full login authentication:
// 1. Set user state back to null by default: useState<User | null>(null)
// 2. Set loading state back to true: useState(true)
// 3. Comment out/remove the mock user assignments in refreshUser()
const mockUser: User = {
  id: 1,
  username: "devuser",
  email: "dev@insight.ai",
  role: "admin",
  created_at: new Date().toISOString()
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(mockUser);
  const [loading, setLoading] = useState(false);

  const refreshUser = async () => {
    // Development bypass
    setUser(mockUser);
    setLoading(false);
    return;

    /*
    try {
      const data = await authApi.getMe();
      setUser(data);
    } catch (error) {
      setUser(null);
      localStorage.removeItem('insight_token');
    } finally {
      setLoading(false);
    }
    */
  };

  useEffect(() => {
    // Development bypass: do not attempt to reload profiles from tokens
    setLoading(false);
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('insight_token', token);
    setLoading(true);
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('insight_token');
    // Development bypass: keep mockUser loaded to avoid logging out in dev mode
    setUser(mockUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
