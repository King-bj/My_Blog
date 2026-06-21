'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { SiteConfig } from '@/types';

interface ConfigContextValue {
  config: SiteConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  reload: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

let inflightFetch: Promise<SiteConfig> | null = null;

async function fetchSiteConfig(): Promise<SiteConfig> {
  if (inflightFetch) {
    return inflightFetch;
  }

  inflightFetch = (async () => {
    const response = await fetch('/api/config', { method: 'GET' });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取配置失败');
    }

    return result.data as SiteConfig;
  })();

  try {
    return await inflightFetch;
  } finally {
    inflightFetch = null;
  }
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSiteConfig();
      setConfig(data);
    } catch (err) {
      setConfig(null);
      setError(err instanceof Error ? err.message : '获取配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const value: ConfigContextValue = {
    config,
    loading,
    error,
    refetch: loadConfig,
    reload: loadConfig,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfigContext(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
}
