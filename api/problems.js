import fs from 'node:fs/promises';
import path from 'node:path';

async function listFromDisk() {
  const dir = path.join(process.cwd(), 'problems');
  const files = await fs.readdir(dir);
  const problems = [];
  for (const file of files.filter((f) => f.endsWith('.txt'))) {
    const content = await fs.readFile(path.join(dir, file), 'utf-8');
    problems.push({ filename: file, content });
  }
  return problems;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Optional Blob storage when configured; otherwise read bundled problems/
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { listProblems } = await import('../lib/problemsStore.js');
      return res.status(200).json(await listProblems());
    }

    return res.status(200).json(await listFromDisk());
  } catch (err) {
    console.error('GET /api/problems', err);
    return res.status(500).json({
      error: 'Failed to read problems',
      detail: err?.message || String(err),
    });
  }
}
