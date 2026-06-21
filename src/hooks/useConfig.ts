'use client';

import { useConfigContext } from '@/components/ConfigProvider';

export function useConfig() {
  const { config, loading, error, refetch, reload } = useConfigContext();

  return {
    data: config,
    loading,
    error,
    refetch,
    reload,
  };
}
