import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, getPaginatedPosts } from '@/lib/posts';
import { CACHE_HEADERS, withCacheHeaders } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '6');
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');

    let posts = getAllPosts();
    
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.description?.toLowerCase().includes(searchLower) ||
        post.excerpt?.toLowerCase().includes(searchLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (tag) {
      posts = posts.filter(post => 
        post.tags.some(postTag => 
          postTag.toLowerCase() === tag.toLowerCase()
        )
      );
    }

    if (searchParams.get('paginated') === 'true') {
      const totalPosts = posts.length;
      const totalPages = Math.ceil(totalPosts / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedPosts = posts.slice(startIndex, endIndex);
      
      return withCacheHeaders(
        NextResponse.json({
          success: true,
          data: {
            posts: paginatedPosts,
            pagination: {
              currentPage: page,
              totalPages,
              totalPosts,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1,
            }
          }
        }),
        CACHE_HEADERS.posts
      );
    }

    return withCacheHeaders(
      NextResponse.json({
        success: true,
        data: posts
      }),
      CACHE_HEADERS.posts
    );

  } catch (error) {
    console.error('❌ 获取文章列表失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取文章列表失败', 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}
