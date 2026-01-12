/**
 * 导航卡片组件
 * 支持 Iconify 图标、自定义背景、悬浮效果
 */
import { Icon } from '@iconify/react';
import type { Card, Settings } from '../types';
import './NavCard.css';

export interface NavCardProps {
  card: Card;
  settings: Settings | null;
  onEdit?: (card: Card) => void;
  onDelete?: (card: Card) => void;
  onOpenIframe?: (card: Card) => void;
}

export function NavCard({ card, settings, onEdit, onDelete, onOpenIframe }: NavCardProps) {
  // 根据设置选择内网或外网地址
  const url = settings?.use_external_url ? card.external_url : card.internal_url;
  
  /**
   * 处理卡片点击
   */
  const handleClick = (e: React.MouseEvent) => {
    if (!url) return;
    
    // 如果设置了小窗口打开
    if (card.open_in_iframe && onOpenIframe) {
      e.preventDefault();
      onOpenIframe(card);
      return;
    }
    
    // 新标签页或当前页面打开
    if (card.open_in_new_tab) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  };

  /**
   * 渲染图标
   */
  const renderIcon = () => {
    if (!card.icon) {
      // 默认图标
      return <Icon icon="mdi:application" className="nav-card-icon" />;
    }
    
    if (card.icon_type === 'iconify') {
      return <Icon icon={card.icon} className="nav-card-icon" />;
    }
    
    // URL 或上传的图标
    return <img src={card.icon} alt={card.title} className="nav-card-icon-img" />;
  };

  return (
    <div 
      className="nav-card"
      onClick={handleClick}
      style={{
        '--icon-bg': card.icon_background || 'rgba(79, 195, 247, 0.2)'
      } as React.CSSProperties}
    >
      <div className="nav-card-icon-wrapper">
        {renderIcon()}
      </div>
      
      <div className="nav-card-content">
        <h3 className="nav-card-title">{card.title}</h3>
        {card.description && (
          <p className="nav-card-desc">{card.description}</p>
        )}
      </div>
      
      {/* 编辑/删除按钮 */}
      {(onEdit || onDelete) && (
        <div className="nav-card-actions" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button 
              className="btn-icon" 
              onClick={() => onEdit(card)}
              title="编辑"
            >
              <Icon icon="mdi:pencil" />
            </button>
          )}
          {onDelete && (
            <button 
              className="btn-icon" 
              onClick={() => onDelete(card)}
              title="删除"
            >
              <Icon icon="mdi:delete" />
            </button>
          )}
        </div>
      )}
      
      {/* 网络模式指示器 */}
      {card.internal_url && card.external_url && (
        <div className="nav-card-network-indicator" title={settings?.use_external_url ? '外网' : '内网'}>
          <Icon icon={settings?.use_external_url ? 'mdi:earth' : 'mdi:home-network'} />
        </div>
      )}
    </div>
  );
}

export default NavCard;
