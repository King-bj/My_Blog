import { NextRequest, NextResponse } from 'next/server';
import { getAllTags, getPostsByTag } from '@/lib/posts';
import { CACHE_HEADERS, withCacheHeaders } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    if (tag) {
      const posts = getPostsByTag(tag);
      return withCacheHeaders(
        NextResponse.json({
          success: true,
          data: {
            tag,
            posts,
            count: posts.length
          }
        }),
        CACHE_HEADERS.tags
      );
    }

    const tags = getAllTags();
    return withCacheHeaders(
      NextResponse.json({
        success: true,
        data: tags
      }),
      CACHE_HEADERS.tags
    );

  } catch (error) {
    console.error('❌ 获取标签失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取标签失败', 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}
