import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'applicant';
  organization_name?: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  profiles: User[];
  login: (token: string, user: User) => void;
  logout: () => void;
  switchToProfile: (userId: string) => Promise<User | null>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [profiles, setProfiles] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available profiles for quick switching
  const fetchProfiles = async () => {
    try {
      const res = await api.get('/auth/profiles');
      setProfiles(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to load profiles:', err);
      return [];
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const availableProfiles = await fetchProfiles();

      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch {
          // If token expired/invalid, auto fallback to first available profile
          if (availableProfiles && availableProfiles.length > 0) {
            await doSwitch(availableProfiles[0].id);
          } else {
            logout();
          }
        }
      } else {
        // If not logged in at all, automatically activate default profile (No password required)
        if (availableProfiles && availableProfiles.length > 0) {
          await doSwitch(availableProfiles[0].id);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const doSwitch = async (userId: string): Promise<User | null> => {
    try {
      const res = await api.post(`/auth/switch/${userId}`);
      const { access_token } = res.data;
      // Update token in api axios defaults immediately
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      login(access_token, meRes.data);
      return meRes.data;
    } catch (err) {
      console.error('Error switching profile:', err);
      return null;
    }
  };

  const switchToProfile = async (userId: string): Promise<User | null> => {
    return await doSwitch(userId);
  };

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, profiles, login, logout, switchToProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
