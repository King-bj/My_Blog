import { NextResponse } from 'next/server';

export function withCacheHeaders(
  response: NextResponse,
  cacheControl: string
): NextResponse {
  response.headers.set('Cache-Control', cacheControl);
  return response;
}

export const CACHE_HEADERS = {
  config: 'private, max-age=30, stale-while-revalidate=60',
  posts: 'public, max-age=60, stale-while-revalidate=300',
  post: 'public, max-age=300, stale-while-revalidate=600',
  tags: 'public, max-age=60, stale-while-revalidate=300',
} as const;
