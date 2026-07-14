import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  buildSessionToken,
  getAuthCredentials,
  safeEqualString,
} from '../lib/auth';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = getAuthCredentials();
  if (!username || !password) {
    return res.status(500).json({ error: 'Login credentials are not configured on the server' });
  }

  let body: any = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }
  body = body || {};
  const inputUsername = typeof body.username === 'string' ? body.username.trim() : '';
  const inputPassword = typeof body.password === 'string' ? body.password : '';

  if (!inputUsername || !inputPassword) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const userOk = safeEqualString(inputUsername, username);
  const passOk = safeEqualString(inputPassword, password);

  if (!userOk || !passOk) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = buildSessionToken(username, password);
  return res.status(200).json({ success: true, token });
}
