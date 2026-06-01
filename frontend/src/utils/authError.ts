import { isAxiosError } from 'axios';
import { getApiErrorMessage } from './apiError';

export function getRegisterErrorMessage(error: unknown): string {
  const fromApi = getApiErrorMessage(error, '');
  if (fromApi) {
    return fromApi;
  }
  if (isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the server. Make sure the backend is running.';
    }
    if (error.response.status === 409) {
      return 'This email is already registered. Sign in instead.';
    }
    if (error.response.status === 400) {
      return 'Check your email and password (minimum 8 characters).';
    }
  }
  return 'Could not create account. Please try again.';
}

export function getLoginErrorMessage(error: unknown): string {
  const fromApi = getApiErrorMessage(error, '');
  if (fromApi) {
    return fromApi;
  }
  if (isAxiosError(error) && !error.response) {
    return 'Cannot reach the server. Make sure the backend is running.';
  }
  return 'Invalid email or password.';
}
