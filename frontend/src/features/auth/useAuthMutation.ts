import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/http';
import { useAuthStore } from '../../store/authStore';
import type { AuthTokenResponse } from '../../types';

export function useAuthMutation(endpoint: '/auth/login' | '/auth/register') {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<AuthTokenResponse>(endpoint, data),
    onSuccess: (res) => {
      setAuth(res.data.accessToken, res.data.user);
      navigate('/');
    },
  });
}
