'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { useConfig } from '@/hooks/useConfig';
import { ThemeToggle } from '@/components/ThemeToggle';

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="content-wrapper">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-32 shimmer rounded" />
            <div className="h-4 w-4 shimmer rounded" />
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-16 shimmer rounded" />
            ))}
            <ThemeToggle />
          </nav>

          <div className="flex md:hidden items-center space-x-4">
            <ThemeToggle />
            <div className="h-6 w-6 shimmer rounded" />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * 条件性Header组件
 * 根据当前路径决定是否显示Header
 * 在管理员登录页面（secureEntrance路径）时隐藏Header
 */
export function ConditionalHeader() {
  const pathname = usePathname();
  const { data: config, loading } = useConfig();

  if (loading || !config) {
    return <HeaderSkeleton />;
  }

  const isAdminLoginPage = pathname === `/${config.secureEntrance}`;
  const isAdminPage = pathname.startsWith('/admin');

  if (isAdminLoginPage || isAdminPage) {
    return null;
  }

  return <Header />;
}
