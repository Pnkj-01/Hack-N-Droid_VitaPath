import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { AuthProvider, useAuthContext } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

// Mock supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('provides initial auth state', () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
  });

  it('handles sign in successfully', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { session: { user: mockUser } },
      error: null,
    });

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('handles sign in error', async () => {
    const mockError = new Error('Invalid credentials');
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { session: null },
      error: mockError,
    });

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await expect(
      act(async () => {
        await result.current.signIn('test@example.com', 'wrong-password');
      })
    ).rejects.toThrow('Invalid credentials');
  });
}); 