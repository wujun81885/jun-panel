/**
 * 类型定义文件
 * 定义前端数据结构和 API 响应类型
 */

// ==================== 用户相关 ====================

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

// 登录相关类型已移除

// ==================== 分组相关 ====================

export interface Group {
  id: number;
  user_id: number;
  name: string;
  icon?: string;
  sort_order: number;
  is_collapsed: number;
  created_at: string;
}

export interface GroupCreate {
  name: string;
  icon?: string;
  sort_order?: number;
}

export interface GroupUpdate {
  name?: string;
  icon?: string;
  sort_order?: number;
  is_collapsed?: number;
}

// ==================== 卡片相关 ====================

export interface Card {
  id: number;
  user_id: number;
  group_id?: number;
  title: string;
  description?: string;
  icon?: string;
  icon_type: string;
  icon_background?: string;
  internal_url?: string;
  external_url?: string;
  open_in_new_tab: boolean;
  open_in_iframe: boolean;
  sort_order: number;
  created_at: string;
  group?: Group;
}

export interface CardCreate {
  title: string;
  description?: string;
  group_id?: number;
  icon?: string;
  icon_type?: string;
  icon_background?: string;
  internal_url?: string;
  external_url?: string;
  open_in_new_tab?: boolean;
  open_in_iframe?: boolean;
  sort_order?: number;
}

export interface CardUpdate {
  title?: string;
  description?: string;
  group_id?: number;
  icon?: string;
  icon_type?: string;
  icon_background?: string;
  internal_url?: string;
  external_url?: string;
  open_in_new_tab?: boolean;
  open_in_iframe?: boolean;
  sort_order?: number;
}

// ==================== 设置相关 ====================

export interface Settings {
  id: number;
  user_id: number;
  theme: string;
  wallpaper?: string;
  wallpaper_blur: number;
  use_external_url: boolean;
  show_search_bar: boolean;
  search_engine: string;
  card_style: string;
  custom_css?: string;
  custom_js?: string;
  // 组件显示开关
  show_weather: boolean;
  show_system_monitor: boolean;
  show_docker_panel: boolean;
  show_notepad: boolean;
}

export interface SettingsUpdate {
  theme?: string;
  wallpaper?: string;
  wallpaper_blur?: number;
  use_external_url?: boolean;
  show_search_bar?: boolean;
  search_engine?: string;
  card_style?: string;
  custom_css?: string;
  custom_js?: string;
  // 组件显示开关
  show_weather?: boolean;
  show_system_monitor?: boolean;
  show_docker_panel?: boolean;
  show_notepad?: boolean;
}

// ==================== 系统状态相关 ====================

export interface SystemStatus {
  cpu_percent: number;
  memory_percent: number;
  memory_used: number;
  memory_total: number;
  disk_percent: number;
  disk_used: number;
  disk_total: number;
}

// ==================== Docker 相关 ====================

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: string;
  ports: Record<string, string[]>;
}

export interface DockerStatus {
  available: boolean;
  message: string;
}

// ==================== 通用响应 ====================

export interface MessageResponse {
  message: string;
  success: boolean;
}

export interface SortItem {
  id: number;
  sort_order: number;
  group_id?: number | null;
}
