/**
 * Docker 容器管理面板组件
 * 显示容器列表，支持启动/停止/重启操作
 */
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useDocker } from '../hooks';
import toast from 'react-hot-toast';
import './DockerPanel.css';

export function DockerPanel() {
  const { 
    dockerStatus, 
    containers, 
    isLoading, 
    error,
    startContainer,
    stopContainer,
    restartContainer 
  } = useDocker(5000);
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  /**
   * 获取容器状态颜色
   */
  const getStatusColor = (state: string) => {
    switch (state) {
      case 'running':
        return 'var(--color-success)';
      case 'paused':
        return 'var(--color-warning)';
      case 'exited':
      case 'dead':
        return 'var(--color-danger)';
      default:
        return 'var(--color-text-muted)';
    }
  };
  
  /**
   * 获取状态文本
   */
  const getStatusText = (state: string) => {
    switch (state) {
      case 'running':
        return '运行中';
      case 'paused':
        return '已暂停';
      case 'exited':
        return '已停止';
      case 'restarting':
        return '重启中';
      case 'created':
        return '已创建';
      default:
        return state;
    }
  };
  
  /**
   * 处理容器操作
   */
  const handleAction = async (containerId: string, action: 'start' | 'stop' | 'restart') => {
    setActionLoading(containerId);
    
    try {
      let success = false;
      switch (action) {
        case 'start':
          success = await startContainer(containerId);
          break;
        case 'stop':
          success = await stopContainer(containerId);
          break;
        case 'restart':
          success = await restartContainer(containerId);
          break;
      }
      
      if (success) {
        const actionText = action === 'start' ? '启动' : action === 'stop' ? '停止' : '重启';
        toast.success(`容器${actionText}成功`);
      } else {
        toast.error('操作失败');
      }
    } catch {
      toast.error('操作失败');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Docker 不可用
  if (dockerStatus && !dockerStatus.available) {
    return (
      <div className="docker-panel glass-card">
        <div className="docker-panel-header">
          <Icon icon="mdi:docker" />
          <span>Docker 管理</span>
        </div>
        <div className="docker-panel-unavailable">
          <Icon icon="mdi:docker" />
          <p>Docker 服务不可用</p>
          <span>请确保 Docker 已启动并正确配置</span>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="docker-panel glass-card">
        <div className="docker-panel-header">
          <Icon icon="mdi:docker" />
          <span>Docker 管理</span>
        </div>
        <div className="docker-panel-loading">
          <Icon icon="mdi:loading" className="animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="docker-panel glass-card">
        <div className="docker-panel-header">
          <Icon icon="mdi:docker" />
          <span>Docker 管理</span>
        </div>
        <div className="docker-panel-error">
          <Icon icon="mdi:alert-circle" />
          <span>{error}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="docker-panel glass-card">
      <div className="docker-panel-header">
        <Icon icon="mdi:docker" />
        <span>Docker 管理</span>
        <span className="docker-panel-count">{containers.length} 个容器</span>
      </div>
      
      <div className="docker-panel-list">
        {containers.length === 0 ? (
          <div className="docker-panel-empty">
            <Icon icon="mdi:package-variant" />
            <span>暂无容器</span>
          </div>
        ) : (
          containers.map((container) => (
            <div key={container.id} className="docker-container-item">
              <div className="docker-container-info">
                <div className="docker-container-name">{container.name}</div>
                <div className="docker-container-image">{container.image}</div>
              </div>
              
              <div 
                className="docker-container-status"
                style={{ color: getStatusColor(container.state) }}
              >
                <span className="docker-status-dot" style={{ backgroundColor: getStatusColor(container.state) }} />
                {getStatusText(container.state)}
              </div>
              
              <div className="docker-container-actions">
                {container.state === 'running' ? (
                  <>
                    <button
                      className="btn-icon"
                      onClick={() => handleAction(container.id, 'stop')}
                      disabled={actionLoading === container.id}
                      title="停止"
                    >
                      {actionLoading === container.id ? (
                        <Icon icon="mdi:loading" className="animate-spin" />
                      ) : (
                        <Icon icon="mdi:stop" />
                      )}
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleAction(container.id, 'restart')}
                      disabled={actionLoading === container.id}
                      title="重启"
                    >
                      <Icon icon="mdi:restart" />
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-icon docker-start-btn"
                    onClick={() => handleAction(container.id, 'start')}
                    disabled={actionLoading === container.id}
                    title="启动"
                  >
                    {actionLoading === container.id ? (
                      <Icon icon="mdi:loading" className="animate-spin" />
                    ) : (
                      <Icon icon="mdi:play" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DockerPanel;
