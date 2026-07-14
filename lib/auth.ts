import crypto from 'crypto';

export function getAuthCredentials() {
  const username = (process.env.R_Username || '').trim();
  const password = process.env.R_Password ?? '';
  return { username, password };
}

export function buildSessionToken(username: string, password: string): string {
  return crypto
    .createHmac('sha256', password || 'recur')
    .update(`recur:${username}`)
    .digest('hex');
}

export function getExpectedToken(): string | null {
  const { username, password } = getAuthCredentials();
  if (!username || !password) return null;
  return buildSessionToken(username, password);
}

export function extractBearerToken(authorization: string | undefined): string | null {
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim() || null;
  }
  return null;
}

export function isValidToken(token: string | null): boolean {
  const expected = getExpectedToken();
  if (!expected || !token || token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function safeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
