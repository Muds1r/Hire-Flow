import { API_BASE_URL } from '../api/client';

/** POST /tests/:id/submit with keepalive so it can run during tab close / navigate away. */
export function submitTestKeepAlive(testId: string): Promise<void> {
  if (!testId) {
    return Promise.resolve();
  }
  const url = `${API_BASE_URL}/tests/${testId}/submit`;
  return fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    keepalive: true,
  }).then((res) => {
    if (!res.ok) {
      return Promise.reject(new Error(`Submit failed: ${res.status}`));
    }
  });
}
