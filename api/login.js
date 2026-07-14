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

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export default function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password } = getCredentials();
    if (!username || !password) {
      return res.status(500).json({
        error: 'Login credentials are not configured. Set R_Username and R_Password in Vercel env vars.',
      });
    }

    let body = {};
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body || '{}');
      } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    }

    const inputUsername = typeof body.username === 'string' ? body.username.trim() : '';
    const inputPassword = typeof body.password === 'string' ? body.password : '';

    if (!inputUsername || !inputPassword) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (!safeEqual(inputUsername, username) || !safeEqual(inputPassword, password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    return res.status(200).json({
      success: true,
      token: buildToken(username, password),
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
