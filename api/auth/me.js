import { createHmac, timingSafeEqual } from 'node:crypto';

function getCredentials() {
  return {
    username: (process.env.R_Username || '').trim(),
    password: process.env.R_Password ?? '',
  };
}

function buildToken(username, password) {
  return createHmac('sha256', password || 'recur')
    .update(`recur:${username}`)
    .digest('hex');
}

function isValidToken(token) {
  const { username, password } = getCredentials();
  if (!username || !password || !token) return false;
  const expected = buildToken(username, password);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export default function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const header = req.headers.authorization;
    const token =
      typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice(7).trim()
        : null;

    if (!isValidToken(token)) {
      return res.status(401).json({ authenticated: false });
    }

    return res.status(200).json({
      authenticated: true,
      username: getCredentials().username,
    });
  } catch (err) {
    console.error('auth/me error', err);
    return res.status(500).json({ authenticated: false, error: 'Internal server error' });
  }
}
