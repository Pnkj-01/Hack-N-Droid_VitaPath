import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('Auth context must be used within AuthProvider');
  }
  return context;
};