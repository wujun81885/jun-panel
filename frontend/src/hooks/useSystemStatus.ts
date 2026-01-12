/**
 * 系统状态轮询 Hook
 * 定期获取 CPU、内存、磁盘使用信息
 */
import { useState, useEffect, useCallback } from 'react';
import { systemApi } from '../api';
import type { SystemStatus } from '../types';

interface UseSystemStatusReturn {
  status: SystemStatus | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * 格式化字节为人类可读格式
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function useSystemStatus(pollingInterval: number = 5000): UseSystemStatusReturn {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await systemApi.getStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('无法获取系统状态');
      console.error('获取系统状态失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 首次获取
    fetchStatus();

    // 定时轮询
    const interval = setInterval(fetchStatus, pollingInterval);

    return () => clearInterval(interval);
  }, [fetchStatus, pollingInterval]);

  return {
    status,
    isLoading,
    error,
    refresh: fetchStatus,
  };
}

export default useSystemStatus;
