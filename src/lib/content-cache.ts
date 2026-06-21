import fs from 'fs';

interface CacheEntry<T> {
  value: T;
  mtimeMs: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getMtimeMs(statPath: string): number {
  try {
    if (!fs.existsSync(statPath)) {
      return 0;
    }
    return fs.statSync(statPath).mtimeMs;
  } catch {
    return 0;
  }
}

export function getDirectoryLatestMtime(dirPath: string): number {
  try {
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    let latest = fs.statSync(dirPath).mtimeMs;
    const entries = fs.readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = `${dirPath}/${entry}`.replace(/\/+/g, '/');
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        latest = Math.max(latest, getDirectoryLatestMtime(fullPath));
      } else {
        latest = Math.max(latest, stat.mtimeMs);
      }
    }

    return latest;
  } catch {
    return 0;
  }
}

export function getCached<T>(key: string, statPath: string, compute: () => T): T {
  const mtimeMs = getMtimeMs(statPath);
  return getCachedByMtime(key, mtimeMs, compute);
}

export function getCachedByMtime<T>(
  key: string,
  mtimeMs: number,
  compute: () => T
): T {
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;

  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.value;
  }

  const value = compute();
  memoryCache.set(key, { value, mtimeMs });
  return value;
}

export function getCachedAsync<T>(
  key: string,
  statPath: string,
  compute: () => Promise<T>
): Promise<T> {
  const mtimeMs = getMtimeMs(statPath);
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;

  if (cached && cached.mtimeMs === mtimeMs) {
    return Promise.resolve(cached.value);
  }

  return compute().then((value) => {
    memoryCache.set(key, { value, mtimeMs });
    return value;
  });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }

  for (const key of Array.from(memoryCache.keys())) {
    const matchesPrefix = key.startsWith(prefix);
    const isPostsIndex = prefix === 'post:' && key === 'posts-index';
    const isHtmlCache = prefix === 'post:' && key.startsWith('html:');

    if (matchesPrefix || isPostsIndex || isHtmlCache) {
      memoryCache.delete(key);
    }
  }
}
