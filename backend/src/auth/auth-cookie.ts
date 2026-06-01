import type { CookieOptions } from 'express';
import type { ConfigService } from '@nestjs/config';

export const AUTH_COOKIE_NAME = 'hire_flow_access_token';

export function getAuthCookieMaxAgeMs(config: ConfigService): number {
  const days = Number(config.get<string>('JWT_EXPIRES_DAYS') ?? '7');
  const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
  return safeDays * 86400 * 1000;
}

export function authCookieOptions(config: ConfigService): CookieOptions {
  const isProd = config.get<string>('NODE_ENV') === 'production';
  const secure =
    config.get<string>('AUTH_COOKIE_SECURE') === 'true' ||
    (isProd && config.get<string>('AUTH_COOKIE_SECURE') !== 'false');

  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: getAuthCookieMaxAgeMs(config),
  };
}

export function clearAuthCookieOptions(config: ConfigService): CookieOptions {
  const { maxAge: _maxAge, ...base } = authCookieOptions(config);
  return { ...base, maxAge: 0 };
}
