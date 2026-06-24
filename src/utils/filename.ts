/** Slugify a problem title into a unique `.txt` filename. */
export function titleToFilename(title: string, takenFilenames: Iterable<string>, exclude?: string): string {
  const taken = new Set(
    [...takenFilenames].filter((f) => f !== exclude)
  );
  const base =
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled';

  let candidate = `${base}.txt`;
  if (!taken.has(candidate)) return candidate;

  let n = 2;
  while (taken.has(`${base}-${n}.txt`)) n++;
  return `${base}-${n}.txt`;
}

export function isDraftFilename(filename: string): boolean {
  return /^new-problem-\d+\.txt$/.test(filename);
}
