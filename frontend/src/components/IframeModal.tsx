/**
 * 网页小窗口预览组件
 * 使用 iframe 在模态框中预览网页
 */
import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { Card, Settings } from '../types';
import './IframeModal.css';

interface IframeModalProps {
  isOpen: boolean;
  card: Card | null;
  settings: Settings | null;
  onClose: () => void;
}

export function IframeModal({ isOpen, card, settings, onClose }: IframeModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen || !card) return null;

  // 根据设置选择内网或外网地址
  const url = settings?.use_external_url ? card.external_url : card.internal_url;

  if (!url) {
    return (
      <div className="iframe-modal-overlay" onClick={onClose}>
        <div className="iframe-modal glass-card" onClick={(e) => e.stopPropagation()}>
          <div className="iframe-header">
            <span className="iframe-title">{card.title}</span>
            <button className="btn-icon" onClick={onClose}>
              <Icon icon="mdi:close" />
            </button>
          </div>
          <div className="iframe-error">
            <Icon icon="mdi:link-off" />
            <span>没有可用的链接地址</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="iframe-modal-overlay" onClick={onClose}>
      <div className="iframe-modal glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="iframe-header">
          <div className="iframe-title-group">
            {card.icon && <Icon icon={card.icon} className="iframe-icon" />}
            <span className="iframe-title">{card.title}</span>
          </div>
          <div className="iframe-actions">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon"
              title="在新标签页打开"
            >
              <Icon icon="mdi:open-in-new" />
            </a>
            <button className="btn-icon" onClick={onClose} title="关闭">
              <Icon icon="mdi:close" />
            </button>
          </div>
        </div>

        <div className="iframe-container">
          {isLoading && (
            <div className="iframe-loading">
              <Icon icon="mdi:loading" className="animate-spin" />
              <span>加载中...</span>
            </div>
          )}
          <iframe
            src={url}
            title={card.title}
            onLoad={() => setIsLoading(false)}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
}

export default IframeModal;
