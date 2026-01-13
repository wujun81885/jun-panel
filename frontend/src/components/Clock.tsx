/**
 * 时钟组件
 * 显示当前时间，支持 12/24 小时制切换
 */
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './Clock.css';

interface ClockProps {
  showSeconds?: boolean;
  use24Hour?: boolean;
}

export function Clock({ showSeconds = true, use24Hour = true }: ClockProps) {
  const [time, setTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(use24Hour);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    let hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    
    let period = '';
    if (!is24Hour) {
      period = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }
    
    const hoursStr = hours.toString().padStart(2, '0');
    
    if (showSeconds) {
      return `${hoursStr}:${minutes}:${seconds}${period}`;
    }
    return `${hoursStr}:${minutes}${period}`;
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return time.toLocaleDateString('zh-CN', options);
  };

  return (
    <div className="clock-widget glass-card">
      <div className="clock-time" onClick={() => setIs24Hour(!is24Hour)} title="点击切换 12/24 小时制">
        {formatTime()}
      </div>
      <div className="clock-date">{formatDate()}</div>
      <button 
        className="clock-format-toggle"
        onClick={() => setIs24Hour(!is24Hour)}
        title={is24Hour ? '切换到 12 小时制' : '切换到 24 小时制'}
      >
        <Icon icon={is24Hour ? 'mdi:clock-time-four' : 'mdi:clock-time-twelve'} />
        <span>{is24Hour ? '24H' : '12H'}</span>
      </button>
    </div>
  );
}

export default Clock;
