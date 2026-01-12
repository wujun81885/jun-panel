/**
 * API 客户端配置
 * 封装 axios 实例和 API 请求方法
 */
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  Card, CardCreate, CardUpdate,
  Group, GroupCreate, GroupUpdate,
  Settings, SettingsUpdate,
  SystemStatus, DockerContainer, DockerStatus,
  MessageResponse, SortItem
} from '../types';

// API 基础地址（生产环境使用相对路径，开发环境使用默认值）
const API_BASE_URL = import.meta.env.PROD 
  ? '' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

// 创建 axios 实例
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ==================== 认证 API ====================

// ==================== 认证 API (已移除) ====================
// export const authApi = { ... };

// ==================== 卡片 API ====================

export const cardsApi = {
  /**
   * 获取所有卡片
   */
  getAll: async (): Promise<Card[]> => {
    const response = await api.get<Card[]>('/api/cards');
    return response.data;
  },

  /**
   * 获取单个卡片
   */
  getById: async (id: number): Promise<Card> => {
    const response = await api.get<Card>(`/api/cards/${id}`);
    return response.data;
  },

  /**
   * 创建卡片
   */
  create: async (data: CardCreate): Promise<Card> => {
    const response = await api.post<Card>('/api/cards', data);
    return response.data;
  },

  /**
   * 更新卡片
   */
  update: async (id: number, data: CardUpdate): Promise<Card> => {
    const response = await api.put<Card>(`/api/cards/${id}`, data);
    return response.data;
  },

  /**
   * 删除卡片
   */
  delete: async (id: number): Promise<MessageResponse> => {
    const response = await api.delete<MessageResponse>(`/api/cards/${id}`);
    return response.data;
  },

  /**
   * 批量更新排序
   */
  updateSort: async (items: SortItem[]): Promise<MessageResponse> => {
    const response = await api.put<MessageResponse>('/api/cards/sort/batch', { items });
    return response.data;
  },
};

// ==================== 分组 API ====================

export const groupsApi = {
  /**
   * 获取所有分组
   */
  getAll: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>('/api/groups');
    return response.data;
  },

  /**
   * 创建分组
   */
  create: async (data: GroupCreate): Promise<Group> => {
    const response = await api.post<Group>('/api/groups', data);
    return response.data;
  },

  /**
   * 更新分组
   */
  update: async (id: number, data: GroupUpdate): Promise<Group> => {
    const response = await api.put<Group>(`/api/groups/${id}`, data);
    return response.data;
  },

  /**
   * 删除分组
   */
  delete: async (id: number): Promise<MessageResponse> => {
    const response = await api.delete<MessageResponse>(`/api/groups/${id}`);
    return response.data;
  },

  /**
   * 批量更新排序
   */
  updateSort: async (items: SortItem[]): Promise<MessageResponse> => {
    const response = await api.put<MessageResponse>('/api/groups/sort/batch', { items });
    return response.data;
  },
};

// ==================== 设置 API ====================

export const settingsApi = {
  /**
   * 获取用户设置
   */
  get: async (): Promise<Settings> => {
    const response = await api.get<Settings>('/api/settings');
    return response.data;
  },

  /**
   * 更新用户设置
   */
  update: async (data: SettingsUpdate): Promise<Settings> => {
    const response = await api.put<Settings>('/api/settings', data);
    return response.data;
  },

  /**
   * 切换内外网模式
   */
  toggleNetwork: async (): Promise<Settings> => {
    const response = await api.post<Settings>('/api/settings/toggle-network');
    return response.data;
  },

  /**
   * 重置设置
   */
  reset: async (): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>('/api/settings/reset');
    return response.data;
  },
};

// ==================== 系统 API ====================

export const systemApi = {
  /**
   * 获取系统状态
   */
  getStatus: async (): Promise<SystemStatus> => {
    const response = await api.get<SystemStatus>('/api/system/status');
    return response.data;
  },
};

// ==================== Docker API ====================

export const dockerApi = {
  /**
   * 获取 Docker 服务状态
   */
  getStatus: async (): Promise<DockerStatus> => {
    const response = await api.get<DockerStatus>('/api/docker/status');
    return response.data;
  },

  /**
   * 获取所有容器
   */
  getContainers: async (all: boolean = true): Promise<DockerContainer[]> => {
    const response = await api.get<DockerContainer[]>('/api/docker/containers', {
      params: { all_containers: all }
    });
    return response.data;
  },

  /**
   * 对容器执行操作
   */
  containerAction: async (containerId: string, action: string): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>(
      `/api/docker/containers/${containerId}/action`,
      { action }
    );
    return response.data;
  },
};

// ==================== 文件上传 API ====================

export const uploadApi = {
  /**
   * 上传图标
   */
  uploadIcon: async (file: File): Promise<{ success: boolean; url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/upload/icon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * 上传壁纸
   */
  uploadWallpaper: async (file: File): Promise<{ success: boolean; url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/upload/wallpaper', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

export default api;
