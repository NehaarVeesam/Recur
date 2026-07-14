import fs from 'node:fs/promises';
import path from 'node:path';

function parseBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return null;
    }
  }
  if (req.body && typeof req.body === 'object') return req.body;
  return {};
}

async function saveToDisk(filename, content, renameTo) {
  const dir = path.join(process.cwd(), 'problems');
  await fs.mkdir(dir, { recursive: true });

  const targetFilename =
    typeof renameTo === 'string' && renameTo.endsWith('.txt') && renameTo !== filename
      ? renameTo
      : filename;

  if (targetFilename !== filename) {
    try {
      await fs.access(path.join(dir, targetFilename));
      const err = new Error('A problem with that filename already exists');
      err.status = 409;
      throw err;
    } catch (e) {
      if (e?.status === 409) throw e;
    }
  }

  await fs.writeFile(path.join(dir, targetFilename), content, 'utf-8');
  if (targetFilename !== filename) {
    try {
      await fs.unlink(path.join(dir, filename));
    } catch {
      // ignore
    }
  }
  return targetFilename;
}

export default async function handler(req, res) {
  try {
    const filename = Array.isArray(req.query.filename)
      ? req.query.filename[0]
      : req.query.filename;

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename is required' });
    }
    if (!filename.endsWith('.txt')) {
      return res.status(400).json({ error: 'Must be a .txt file' });
    }

    // Prefer Blob when configured (durable on Vercel)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { removeProblem, saveProblem } = await import('../../lib/problemsStore.js');

      if (req.method === 'POST') {
        const body = parseBody(req);
        if (body === null) return res.status(400).json({ error: 'Invalid JSON body' });
        const target = await saveProblem(filename, body.content, body.renameTo);
        return res.status(200).json({ success: true, filename: target });
      }

      if (req.method === 'DELETE') {
        await removeProblem(filename);
        return res.status(200).json({ success: true });
      }
    } else {
      if (req.method === 'POST') {
        const body = parseBody(req);
        if (body === null) return res.status(400).json({ error: 'Invalid JSON body' });
        if (typeof body.content !== 'string') {
          return res.status(400).json({ error: 'Content must be a string' });
        }
        try {
          const target = await saveToDisk(filename, body.content, body.renameTo);
          return res.status(200).json({ success: true, filename: target });
        } catch (e) {
          if (e?.status === 409) {
            return res.status(409).json({ error: e.message });
          }
          return res.status(503).json({
            error:
              'Cannot save problems on Vercel filesystem. Create a Blob store in Vercel and set BLOB_READ_WRITE_TOKEN, or use npm run dev locally.',
          });
        }
      }

      if (req.method === 'DELETE') {
        try {
          await fs.unlink(path.join(process.cwd(), 'problems', filename));
          return res.status(200).json({ success: true });
        } catch {
          return res.status(503).json({
            error:
              'Cannot delete problems on Vercel filesystem. Create a Blob store in Vercel and set BLOB_READ_WRITE_TOKEN, or use npm run dev locally.',
          });
        }
      }
    }

    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('/api/problems/[filename]', err);
    const status = err?.status || 500;
    return res.status(status).json({
      error: err?.message || 'Failed to update problem',
    });
  }
}
