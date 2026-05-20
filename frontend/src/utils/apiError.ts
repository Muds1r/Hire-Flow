import { isAxiosError } from 'axios';

type ErrorBody = { message?: string };

function messageFromBody(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const msg = (data as ErrorBody).message;
  return typeof msg === 'string' && msg.length > 0 ? msg : null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong.',
): string {
  if (!isAxiosError(error)) {
    return fallback;
  }
  const data = error.response?.data;
  if (data instanceof Blob) {
    return fallback;
  }
  const parsed = messageFromBody(data);
  return parsed ?? fallback;
}

/** Use when the request used `responseType: 'blob'` — Nest errors come back as JSON inside a Blob. */
export async function getApiErrorMessageAsync(
  error: unknown,
  fallback = 'Something went wrong.',
): Promise<string> {
  if (!isAxiosError(error)) {
    return fallback;
  }
  const data = error.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const json = JSON.parse(text) as ErrorBody;
      const parsed = messageFromBody(json);
      if (parsed) {
        return parsed;
      }
    } catch {
      /* not JSON */
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to view this CV.';
    }
    if (error.response?.status === 404) {
      return 'CV file is not available for this application.';
    }
    return fallback;
  }
  return getApiErrorMessage(error, fallback);
}
