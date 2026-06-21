'use client';

import { usePage } from '@/hooks/usePage';
import { LoadingTransition, SkeletonCard, StaggerContainer } from '@/components/LoadingComponents';
import { CodeBlock } from '@/components/CodeBlock';

export default function AboutPage() {
  const { page: aboutMePage, loading, error } = usePage('about-me');

  if (error) {
    return (
      <div className="content-wrapper py-12">
        <div className="text-center py-16 fade-in">
          <div className="text-red-500 dark:text-red-400">
            <h2 className="text-2xl font-semibold mb-4">加载失败</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!aboutMePage) {
    if (!loading) {
      return (
        <div className="content-wrapper py-12">
          <div className="text-center py-16 fade-in">
            <div className="text-yellow-500 dark:text-yellow-400">
              <h2 className="text-2xl font-semibold mb-4">页面不完整</h2>
              <p>缺少必要的页面内容文件</p>
            </div>
          </div>
        </div>
      );
    }
  }

  const skeletonContent = (
    <div className="content-wrapper py-12">
      <div className="max-w-3xl mx-auto">
        <div className="h-8 w-32 shimmer rounded mb-8"></div>
        <SkeletonCard lines={5} className="min-h-[300px]" />
      </div>
    </div>
  );

  const actualContent = (
    <div className="content-wrapper py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 fade-in-up">关于</h1>

        <StaggerContainer className="space-y-8">
          <div className="card p-8">
            <div className="prose max-w-none">
              <CodeBlock html={aboutMePage?.htmlContent || ''} />
            </div>
          </div>
        </StaggerContainer>
      </div>
    </div>
  );

  return (
    <LoadingTransition
      loading={loading || !aboutMePage}
      skeleton={skeletonContent}
    >
      {actualContent}
    </LoadingTransition>
  );
}
