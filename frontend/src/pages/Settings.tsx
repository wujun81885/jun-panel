/**
 * 设置页面
 * 管理壁纸、搜索框、主题等个人设置
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { settingsApi } from '../api';
import type { Settings } from '../types';
import toast from 'react-hot-toast';
import './Settings.css';

// 预设壁纸
const PRESET_WALLPAPERS = [
  { id: 'none', name: '无壁纸', url: '' },
  { id: 'gradient1', name: '紫色渐变', url: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient2', name: '蓝绿渐变', url: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'gradient3', name: '日落渐变', url: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'gradient4', name: '深海渐变', url: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
    } catch (error) {
      console.error('加载设置失败:', error);
      toast.error('加载设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await settingsApi.update(settings);
      toast.success('设置已保存');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWallpaperSelect = (url: string) => {
    if (!settings) return;
    setSettings({ ...settings, wallpaper: url });
  };

  if (isLoading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <Icon icon="mdi:loading" className="animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container glass-card">
        <div className="settings-header">
          <button className="btn-icon" onClick={() => navigate('/')}>
            <Icon icon="mdi:arrow-left" />
          </button>
          <h1>设置</h1>
        </div>

        <div className="settings-content">
          {/* 显示设置 */}
          <section className="settings-section">
            <h2>显示设置</h2>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">显示搜索框</span>
                <span className="setting-desc">在主页顶部显示搜索框</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings?.show_search_bar || false}
                  onChange={(e) => settings && setSettings({ ...settings, show_search_bar: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">默认搜索引擎</span>
                <span className="setting-desc">搜索框使用的默认搜索引擎</span>
              </div>
              <select
                className="input setting-select"
                value={settings?.search_engine || 'google'}
                onChange={(e) => settings && setSettings({ ...settings, search_engine: e.target.value })}
              >
                <option value="google">Google</option>
                <option value="bing">Bing</option>
                <option value="baidu">百度</option>
                <option value="duckduckgo">DuckDuckGo</option>
              </select>
            </div>
          </section>

          {/* 壁纸设置 */}
          <section className="settings-section">
            <h2>壁纸</h2>

            <div className="wallpaper-grid">
              {PRESET_WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  className={`wallpaper-option ${settings?.wallpaper === wp.url ? 'active' : ''}`}
                  style={{ 
                    background: wp.url || 'var(--color-bg-primary)',
                    backgroundImage: wp.url.startsWith('linear') ? wp.url : undefined
                  }}
                  onClick={() => handleWallpaperSelect(wp.url)}
                >
                  {settings?.wallpaper === wp.url && (
                    <Icon icon="mdi:check-circle" className="wallpaper-check" />
                  )}
                  <span className="wallpaper-name">{wp.name}</span>
                </button>
              ))}
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">壁纸模糊度</span>
                <span className="setting-desc">背景壁纸的模糊程度</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={settings?.wallpaper_blur || 0}
                onChange={(e) => settings && setSettings({ ...settings, wallpaper_blur: Number(e.target.value) })}
                className="setting-slider"
              />
              <span className="slider-value">{settings?.wallpaper_blur || 0}px</span>
            </div>
          </section>

          {/* 网络设置 */}
          <section className="settings-section">
            <h2>网络</h2>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">使用外网地址</span>
                <span className="setting-desc">默认使用外网地址打开链接</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings?.use_external_url || false}
                  onChange={(e) => settings && setSettings({ ...settings, use_external_url: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button className="btn-secondary" onClick={() => navigate('/')}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Icon icon="mdi:loading" className="animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Icon icon="mdi:check" />
                保存设置
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
