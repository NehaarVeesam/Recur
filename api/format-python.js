export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(501).json({
    error:
      'Python formatting (Black) is only available when running Recur locally with npm run dev.',
  });
}
