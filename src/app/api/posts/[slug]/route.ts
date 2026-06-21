import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getPostBySlug, markdownToHtml } from '@/lib/posts';
import { CACHE_HEADERS, withCacheHeaders } from '@/lib/api-cache';

interface RouteContext {
  params: { slug: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const includeContent = searchParams.get('includeContent') !== 'false';

    const post = getPostBySlug(slug);

    if (!post) {
      return NextResponse.json(
        { 
          success: false,
          error: '文章未找到' 
        },
        { status: 404 }
      );
    }

    let responseData: Record<string, unknown> = {
      ...post
    };

    if (includeContent && post.content) {
      const statPath = path.join(process.cwd(), 'content/posts', `${slug}.md`);
      const htmlContent = await markdownToHtml(post.content, { slug, statPath });
      responseData = {
        ...responseData,
        htmlContent
      };
    }

    return withCacheHeaders(
      NextResponse.json({
        success: true,
        data: responseData
      }),
      CACHE_HEADERS.post
    );

  } catch (error) {
    console.error(`❌ 获取文章 ${params.slug} 失败:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取文章失败', 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}
