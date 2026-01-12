/**
 * 系统状态监控组件
 * 显示 CPU、内存、磁盘使用率的仪表盘
 */
import { Icon } from '@iconify/react';
import { useSystemStatus, formatBytes } from '../hooks';
import './SystemMonitor.css';

interface StatusGaugeProps {
  label: string;
  value: number;
  icon: string;
  color: string;
  detail?: string;
}

/**
 * 环形进度条
 */
function StatusGauge({ label, value, icon, color, detail }: StatusGaugeProps) {
  // 计算环形进度
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;
  
  // 根据使用率确定颜色
  const getColor = () => {
    if (value >= 90) return 'var(--color-danger)';
    if (value >= 70) return 'var(--color-warning)';
    return color;
  };
  
  return (
    <div className="status-gauge">
      <div className="status-gauge-ring">
        <svg viewBox="0 0 100 100">
          {/* 背景圆环 */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          {/* 进度圆环 */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="status-gauge-content">
          <Icon icon={icon} className="status-gauge-icon" style={{ color: getColor() }} />
          <span className="status-gauge-value">{value.toFixed(1)}%</span>
        </div>
      </div>
      <div className="status-gauge-label">{label}</div>
      {detail && <div className="status-gauge-detail">{detail}</div>}
    </div>
  );
}

export function SystemMonitor() {
  const { status, isLoading, error } = useSystemStatus(3000);
  
  if (isLoading) {
    return (
      <div className="system-monitor glass-card">
        <div className="system-monitor-header">
          <Icon icon="mdi:chart-donut" />
          <span>系统状态</span>
        </div>
        <div className="system-monitor-loading">
          <Icon icon="mdi:loading" className="animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }
  
  if (error || !status) {
    return (
      <div className="system-monitor glass-card">
        <div className="system-monitor-header">
          <Icon icon="mdi:chart-donut" />
          <span>系统状态</span>
        </div>
        <div className="system-monitor-error">
          <Icon icon="mdi:alert-circle" />
          <span>{error || '无法获取系统状态'}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="system-monitor glass-card">
      <div className="system-monitor-header">
        <Icon icon="mdi:chart-donut" />
        <span>系统状态</span>
      </div>
      
      <div className="system-monitor-gauges">
        <StatusGauge
          label="CPU"
          value={status.cpu_percent}
          icon="mdi:cpu-64-bit"
          color="var(--color-primary)"
        />
        
        <StatusGauge
          label="内存"
          value={status.memory_percent}
          icon="mdi:memory"
          color="var(--color-success)"
          detail={`${formatBytes(status.memory_used)} / ${formatBytes(status.memory_total)}`}
        />
        
        <StatusGauge
          label="磁盘"
          value={status.disk_percent}
          icon="mdi:harddisk"
          color="var(--color-info)"
          detail={`${formatBytes(status.disk_used)} / ${formatBytes(status.disk_total)}`}
        />
      </div>
    </div>
  );
}

export default SystemMonitor;
