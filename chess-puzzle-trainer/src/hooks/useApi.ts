import { useCallback } from 'react';
import { apiRequest } from '../api/client';

// NOTE: request must be wrapped in useCallback so pages that list it as a
// useEffect dependency don't get caught in an infinite fetch loop.
export function useApi() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('chess_token') : null;

  const request = useCallback(
    <T,>(path: string, init?: RequestInit) => apiRequest<T>(path, { ...init, token }),
    [token]
  );

  return { request, token };
}
