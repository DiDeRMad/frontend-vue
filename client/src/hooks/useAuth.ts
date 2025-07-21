import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../stores/store';

export const useAuth = () => {
  const { isAuthenticated, player, token, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // Check token validity on mount
    if (token && !isAuthenticated) {
      // TODO: Validate token with server
    }
  }, [token, isAuthenticated]);

  return {
    isAuthenticated,
    player,
    token,
    isLoading,
    error,
  };
};