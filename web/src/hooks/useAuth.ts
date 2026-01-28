import { useQuery } from '@tanstack/react-query';
import { authApi } from '@services';
import { User } from '@schema';

export const useAuth = () => {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User, Error>({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    retry: false,
    enabled: !!localStorage.getItem('access_token'),
  });

  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
  };
};