import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  avatar_url?: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (data: User) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await AsyncStorage.getItem('@SafetyApp:user');
      if (data) setUser(JSON.parse(data));
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data: User) => {
    await AsyncStorage.setItem('@SafetyApp:user', JSON.stringify(data));
    setUser(data);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('@SafetyApp:user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}