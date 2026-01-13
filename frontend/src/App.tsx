/**
 * Jun-Panel 前端入口
 * 配置路由和全局状态
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Dashboard, SettingsPage } from './pages';
import { settingsApi } from './api';
import './styles/index.css';

function App() {
  // 初始化加载主题
  useEffect(() => {
    const initTheme = async () => {
      try {
        const settings = await settingsApi.get();
        if (settings.theme) {
          document.documentElement.setAttribute('data-theme', settings.theme);
        }
        
        // 注入自定义 CSS
        if (settings.custom_css) {
          const style = document.createElement('style');
          style.id = 'custom-css';
          style.innerHTML = settings.custom_css;
          document.head.appendChild(style);
        }

        // 注入自定义 JS
        if (settings.custom_js) {
          try {
            const script = document.createElement('script');
            script.id = 'custom-js';
            script.innerHTML = settings.custom_js;
            document.body.appendChild(script);
          } catch (err) {
            console.error('Failed to execute custom JS:', err);
          }
        }
      } catch (e) {
        console.error('Failed to load theme settings', e);
      }
    };
    initTheme();
  }, []);

  return (
    <BrowserRouter>
      {/* 全局 Toast 通知 */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(30, 41, 59, 0.95)',
            color: '#f1f5f9',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />
      
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

