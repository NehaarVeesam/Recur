import fs from 'node:fs/promises';
import path from 'node:path';
import { list, put, del } from '@vercel/blob';

const BLOB_PREFIX = 'recur-problems/';

export function problemsDir() {
  return path.join(process.cwd(), 'problems');
}

function hasBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function listFromDisk() {
  const dir = problemsDir();
  const files = await fs.readdir(dir);
  const problems = [];
  for (const file of files.filter((f) => f.endsWith('.txt'))) {
    const content = await fs.readFile(path.join(dir, file), 'utf-8');
    problems.push({ filename: file, content });
  }
  return problems;
}

async function listFromBlob() {
  const problems = [];
  let cursor;
  do {
    const page = await list({ prefix: BLOB_PREFIX, cursor });
    for (const blob of page.blobs) {
      const filename = blob.pathname.slice(BLOB_PREFIX.length);
      if (!filename.endsWith('.txt') || filename.includes('/')) continue;
      const res = await fetch(blob.url);
      if (!res.ok) continue;
      problems.push({ filename, content: await res.text() });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return problems;
}

async function ensureBlobSeeded() {
  const existing = await list({ prefix: BLOB_PREFIX, limit: 1 });
  if (existing.blobs.length > 0) return;

  let diskProblems = [];
  try {
    diskProblems = await listFromDisk();
  } catch {
    return;
  }

  await Promise.all(
    diskProblems.map((p) =>
      put(`${BLOB_PREFIX}${p.filename}`, p.content, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'text/plain; charset=utf-8',
      })
    )
  );
}

export async function listProblems() {
  if (hasBlob()) {
    await ensureBlobSeeded();
    return listFromBlob();
  }
  return listFromDisk();
}

async function deleteBlobByFilename(filename) {
  const page = await list({ prefix: `${BLOB_PREFIX}${filename}` });
  const matches = page.blobs.filter(
    (blob) => blob.pathname === `${BLOB_PREFIX}${filename}`
  );
  if (matches.length === 0) return;
  await del(matches.map((blob) => blob.url));
}

export async function saveProblem(filename, content, renameTo) {
  if (!filename.endsWith('.txt')) {
    const err = new Error('Must be a .txt file');
    err.status = 400;
    throw err;
  }
  if (typeof content !== 'string') {
    const err = new Error('Content must be a string');
    err.status = 400;
    throw err;
  }

  const targetFilename =
    typeof renameTo === 'string' && renameTo.endsWith('.txt') && renameTo !== filename
      ? renameTo
      : filename;

  if (hasBlob()) {
    await ensureBlobSeeded();
    const current = await listFromBlob();
    if (targetFilename !== filename && current.some((p) => p.filename === targetFilename)) {
      const err = new Error('A problem with that filename already exists');
      err.status = 409;
      throw err;
    }

    await put(`${BLOB_PREFIX}${targetFilename}`, content, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'text/plain; charset=utf-8',
    });

    if (targetFilename !== filename) {
      try {
        await deleteBlobByFilename(filename);
      } catch {
        // old draft may already be gone
      }
    }

    return targetFilename;
  }

  // Local / writable filesystem path
  try {
    const dir = problemsDir();
    await fs.mkdir(dir, { recursive: true });

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
  } catch (e) {
    if (e?.status) throw e;
    const err = new Error(
      'Cannot save problems on this host. Add a Vercel Blob store and set BLOB_READ_WRITE_TOKEN, or run locally with npm run dev.'
    );
    err.status = 503;
    throw err;
  }
}

export async function removeProblem(filename) {
  if (!filename.endsWith('.txt')) {
    const err = new Error('Must be a .txt file');
    err.status = 400;
    throw err;
  }

  if (hasBlob()) {
    await ensureBlobSeeded();
    await deleteBlobByFilename(filename);
    return;
  }

  try {
    await fs.unlink(path.join(problemsDir(), filename));
  } catch (e) {
    const err = new Error(
      'Cannot delete problems on this host. Add a Vercel Blob store and set BLOB_READ_WRITE_TOKEN, or run locally with npm run dev.'
    );
    err.status = 503;
    throw err;
  }
}
