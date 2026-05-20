import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../api/client';

/** POST /tests/:id/submit with keepalive so it can run during tab close / navigate away. */
export function submitTestKeepAlive(testId: string): Promise<void> {
  const token = useAuthStore.getState().token;
  if (!token || !testId) {
    return Promise.resolve();
  }
  const url = `${API_BASE_URL}/tests/${testId}/submit`;
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    keepalive: true,
  }).then((res) => {
    if (!res.ok) {
      return Promise.reject(new Error(`Submit failed: ${res.status}`));
    }
  });
}
