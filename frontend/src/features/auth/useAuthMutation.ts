import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { AuthSessionResponse } from '../../types';

export function useAuthMutation(endpoint: '/auth/login' | '/auth/register') {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setReady = useAuthStore((s) => s.setReady);

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<AuthSessionResponse>(endpoint, data),
    onSuccess: (res) => {
      setUser(res.data.user);
      setReady(true);
      navigate('/');
    },
  });
}
