import { createContext, useContext } from 'react';

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

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function useAppAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAppAuth must be used within AuthProvider');
  }
  return context;
}

export { AuthContext };