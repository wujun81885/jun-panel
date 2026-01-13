/**
 * 服务健康检查面板
 * 显示配置的服务在线/离线状态
 */
import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import './HealthCheck.css';

interface ServiceConfig {
  id: string;
  name: string;
  url: string;
}

interface ServiceStatus {
  url: string;
  is_online: boolean;
  status_code?: number;
  response_time?: number;
  error?: string;
}

const STORAGE_KEY = 'jun-panel-health-services';

export function HealthCheck() {
  const [services, setServices] = useState<ServiceConfig[]>([]);
  const [statuses, setStatuses] = useState<Map<string, ServiceStatus>>(new Map());
  const [isChecking, setIsChecking] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // 加载配置
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setServices(JSON.parse(saved));
      } catch {
        setServices([]);
      }
    }
  }, []);

  // 保存配置
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  }, [services]);

  // 检查服务状态
  const checkServices = useCallback(async () => {
    if (services.length === 0) return;
    
    setIsChecking(true);
    try {
      const response = await fetch('/api/health/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: services.map(s => s.url), timeout: 5 })
      });
      
      if (response.ok) {
        const data = await response.json();
        const newStatuses = new Map<string, ServiceStatus>();
        data.results.forEach((r: ServiceStatus) => {
          newStatuses.set(r.url, r);
        });
        setStatuses(newStatuses);
      }
    } catch (e) {
      console.error('Health check failed:', e);
    } finally {
      setIsChecking(false);
    }
  }, [services]);

  // 自动刷新
  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 60000); // 每分钟检查一次
    return () => clearInterval(interval);
  }, [checkServices]);

  const addService = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    
    const service: ServiceConfig = {
      id: Date.now().toString(),
      name: newName.trim(),
      url: newUrl.trim()
    };
    setServices([...services, service]);
    setNewName('');
    setNewUrl('');
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const getStatusIcon = (url: string) => {
    const status = statuses.get(url);
    if (!status) return <Icon icon="mdi:circle-outline" className="status-unknown" />;
    if (status.is_online) return <Icon icon="mdi:check-circle" className="status-online" />;
    return <Icon icon="mdi:close-circle" className="status-offline" />;
  };

  return (
    <div className="health-check glass-card">
      <div className="health-header">
        <div className="health-title">
          <Icon icon="mdi:heart-pulse" />
          <span>服务状态</span>
        </div>
        <div className="health-actions">
          <button 
            className="btn-icon"
            onClick={checkServices}
            disabled={isChecking}
            title="刷新"
          >
            <Icon icon={isChecking ? "mdi:loading" : "mdi:refresh"} className={isChecking ? 'animate-spin' : ''} />
          </button>
          <button 
            className="btn-icon"
            onClick={() => setShowConfig(!showConfig)}
            title="配置"
          >
            <Icon icon="mdi:cog" />
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="health-config">
          <div className="health-config-input">
            <input
              type="text"
              placeholder="服务名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="text"
              placeholder="URL (如 http://192.168.1.1:8080)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addService()}
            />
            <button className="btn-primary btn-sm" onClick={addService}>
              <Icon icon="mdi:plus" />
            </button>
          </div>
        </div>
      )}

      <ul className="health-list">
        {services.length === 0 ? (
          <li className="health-empty">
            <Icon icon="mdi:server-off" />
            <span>暂无配置的服务</span>
            <button className="btn-link" onClick={() => setShowConfig(true)}>添加服务</button>
          </li>
        ) : (
          services.map(service => {
            const status = statuses.get(service.url);
            return (
              <li key={service.id} className="health-item">
                {getStatusIcon(service.url)}
                <div className="health-info">
                  <span className="health-name">{service.name}</span>
                  {status && status.is_online && (
                    <span className="health-latency">{status.response_time}ms</span>
                  )}
                  {status && !status.is_online && (
                    <span className="health-error">{status.error || 'Offline'}</span>
                  )}
                </div>
                {showConfig && (
                  <button 
                    className="health-remove" 
                    onClick={() => removeService(service.id)}
                    title="删除"
                  >
                    <Icon icon="mdi:close" />
                  </button>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export default HealthCheck;
