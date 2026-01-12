/**
 * 日期时间显示组件
 * 在搜索框上方显示当前日期和时间
 */
import { useState, useEffect } from 'react';
import './DateTime.css';

export function DateTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    return now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = () => {
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDay = weekDays[now.getDay()];
    return `${month}月${day}日 ${weekDay}`;
  };

  return (
    <div className="datetime-widget">
      <div className="datetime-time">{formatTime()}</div>
      <div className="datetime-date">{formatDate()}</div>
    </div>
  );
}

export default DateTime;
