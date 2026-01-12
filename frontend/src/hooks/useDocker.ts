/**
 * Docker 容器管理 Hook
 * 获取容器列表并提供操作方法
 */
import { useState, useEffect, useCallback } from 'react';
import { dockerApi } from '../api';
import type { DockerContainer, DockerStatus } from '../types';

interface UseDockerReturn {
  dockerStatus: DockerStatus | null;
  containers: DockerContainer[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startContainer: (containerId: string) => Promise<boolean>;
  stopContainer: (containerId: string) => Promise<boolean>;
  restartContainer: (containerId: string) => Promise<boolean>;
}

export function useDocker(pollingInterval: number = 10000): UseDockerReturn {
  const [dockerStatus, setDockerStatus] = useState<DockerStatus | null>(null);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // 先检查 Docker 状态
      const status = await dockerApi.getStatus();
      setDockerStatus(status);

      if (status.available) {
        // Docker 可用时获取容器列表
        const containerList = await dockerApi.getContainers();
        setContainers(containerList);
      } else {
        setContainers([]);
      }

      setError(null);
    } catch (err) {
      setError('无法获取 Docker 信息');
      console.error('获取 Docker 信息失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 首次获取
    fetchData();

    // 定时轮询
    const interval = setInterval(fetchData, pollingInterval);

    return () => clearInterval(interval);
  }, [fetchData, pollingInterval]);

  /**
   * 启动容器
   */
  const startContainer = useCallback(async (containerId: string): Promise<boolean> => {
    try {
      await dockerApi.containerAction(containerId, 'start');
      await fetchData(); // 刷新列表
      return true;
    } catch (err) {
      console.error('启动容器失败:', err);
      return false;
    }
  }, [fetchData]);

  /**
   * 停止容器
   */
  const stopContainer = useCallback(async (containerId: string): Promise<boolean> => {
    try {
      await dockerApi.containerAction(containerId, 'stop');
      await fetchData(); // 刷新列表
      return true;
    } catch (err) {
      console.error('停止容器失败:', err);
      return false;
    }
  }, [fetchData]);

  /**
   * 重启容器
   */
  const restartContainer = useCallback(async (containerId: string): Promise<boolean> => {
    try {
      await dockerApi.containerAction(containerId, 'restart');
      await fetchData(); // 刷新列表
      return true;
    } catch (err) {
      console.error('重启容器失败:', err);
      return false;
    }
  }, [fetchData]);

  return {
    dockerStatus,
    containers,
    isLoading,
    error,
    refresh: fetchData,
    startContainer,
    stopContainer,
    restartContainer,
  };
}

export default useDocker;
