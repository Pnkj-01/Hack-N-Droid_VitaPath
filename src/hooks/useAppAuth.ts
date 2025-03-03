import { useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext } from 'react';

interface User {
  id: string;
  email: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AppAuthContext = createContext<AuthState | undefined>(undefined);

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth must be used within AppAuthProvider');
  }
  return context;
}
export { AppAuthContext };