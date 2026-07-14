import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  extractBearerToken,
  getAuthCredentials,
  isValidToken,
} from '../_lib/auth';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = extractBearerToken(
    typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined
  );

  if (!isValidToken(token)) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    username: getAuthCredentials().username,
  });
}
