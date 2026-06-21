import { NextRequest, NextResponse } from 'next/server';
import { loadServerSiteConfig as getSiteConfigServer, saveServerSiteConfig, validateSiteConfig } from '@/lib/config.server';
import { extractTokenFromRequest, verifyToken } from '@/lib/auth';
import { SiteConfig } from '@/types';
import { CACHE_HEADERS, withCacheHeaders } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const config = getSiteConfigServer();
    
    const response = NextResponse.json({
      success: true,
      data: config
    });
    
    return withCacheHeaders(response, CACHE_HEADERS.config);
  } catch (error) {
    console.error('❌ 配置API错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取配置失败', 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: '未授权访问',
          message: '需要管理员权限才能修改配置'
        },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          error: '未授权访问',
          message: '需要管理员权限才能修改配置'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const config = body as Partial<SiteConfig>;

    const validationErrors = validateSiteConfig(config);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '配置验证失败',
          errors: validationErrors
        },
        { status: 400 }
      );
    }

    const completeConfig = config as SiteConfig;
    saveServerSiteConfig(completeConfig);
    
    const response = NextResponse.json({
      success: true,
      data: completeConfig,
      message: '配置保存成功'
    });
    
    return withCacheHeaders(response, CACHE_HEADERS.config);
  } catch (error) {
    console.error('❌ 配置保存API错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '保存配置失败', 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}
