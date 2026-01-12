/**
 * 卡片管理模态框
 * Used for adding and editing navigation cards
 */
import { useState, useEffect, type FormEvent } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import type { Card, CardCreate, CardUpdate, Group } from '../types';
import { groupsApi } from '../api';
import './CardModal.css';

interface CardModalProps {
  isOpen: boolean;
  card?: Card | null;
  groups: Group[];
  onClose: () => void;
  onSave: (data: CardCreate | CardUpdate) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

// 常用图标列表
const POPULAR_ICONS = [
  'mdi:home', 'mdi:folder', 'mdi:file-document', 'mdi:cog',
  'mdi:server', 'mdi:database', 'mdi:cloud', 'mdi:docker',
  'mdi:github', 'mdi:gitlab', 'mdi:youtube', 'mdi:spotify',
  'mdi:netflix', 'mdi:music', 'mdi:movie', 'mdi:camera',
  'mdi:email', 'mdi:chat', 'mdi:calendar', 'mdi:chart-bar',
  'mdi:download', 'mdi:upload', 'mdi:link', 'mdi:web',
];

export function CardModal({ isOpen, card, groups, onClose, onSave, onDelete }: CardModalProps) {
  const [formData, setFormData] = useState<CardCreate>({
    title: '',
    icon: 'mdi:application',
    icon_type: 'iconify',
    internal_url: '',
    external_url: '',
    description: '',
    group_id: undefined,
    open_in_new_tab: true,
    open_in_iframe: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [customIcon, setCustomIcon] = useState('');
  
  // 新建分组状态
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // 编辑模式时填充数据
  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title,
        icon: card.icon || 'mdi:application',
        icon_type: card.icon_type || 'iconify',
        internal_url: card.internal_url || '',
        external_url: card.external_url || '',
        description: card.description || '',
        group_id: card.group_id,
        open_in_new_tab: card.open_in_new_tab,
        open_in_iframe: card.open_in_iframe,
      });
    } else {
      // 重置为默认值
      setFormData({
        title: '',
        icon: 'mdi:application',
        icon_type: 'iconify',
        internal_url: '',
        external_url: '',
        description: '',
        group_id: undefined,
        open_in_new_tab: true,
        open_in_iframe: false,
      });
    }
    // 重置分组创建状态
    setIsCreatingGroup(false);
    setNewGroupName('');
  }, [card, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      let finalGroupId = formData.group_id;

      // 如果是新建分组模式，先创建分组
      if (isCreatingGroup && newGroupName.trim()) {
        const newGroup = await groupsApi.create({ name: newGroupName.trim() });
        finalGroupId = newGroup.id;
        toast.success(`已创建分组: ${newGroup.name}`);
      }

      await onSave({ ...formData, group_id: finalGroupId });
      onClose();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!card || !onDelete) return;
    if (!confirm('确定要删除这个卡片吗？')) return;

    setIsLoading(true);
    try {
      await onDelete(card.id);
      onClose();
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIconSelect = (icon: string) => {
    setFormData({ ...formData, icon, icon_type: 'iconify' });
    setShowIconPicker(false);
  };

  const handleCustomIconApply = () => {
    if (customIcon.trim()) {
      setFormData({ ...formData, icon: customIcon.trim(), icon_type: 'iconify' });
      setCustomIcon('');
      setShowIconPicker(false);
    }
  };

  // 自动获取网站图标
  const handleUrlBlur = (url: string) => {
    if (!url) return;
    
    // 如果是手动点击按钮触发的（不是 onBlur），且当前已经有图标，询问用户是否覆盖？
    // 这里简单处理：总是尝试抓取
    
    try {
      // 简单的 URL 校验
      const urlStr = url.startsWith('http') ? url : `http://${url}`;
      const urlObj = new URL(urlStr);
      // 使用 Google Favicon 服务获取图标
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
      
      setFormData(prev => ({ ...prev, icon: faviconUrl, icon_type: 'url' }));
      
      // 如果不是 onBlur 自动触发的（通过判断调用来源？不方便），或者我们直接显示成功
      // 但为了不打扰 onBlur，我们只在 url 有效时 log 或不提示。
      // 对于按钮点击，我们可以单纯依赖图标的变化作为反馈。
      // 或者：既然用户点了按钮，给个反馈更好。
    } catch (e) {
      // URL 无效，忽略
      toast.error('URL 格式不正确');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{card ? '编辑卡片' : '添加卡片'}</h2>
          <button className="btn-icon" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {/* ... */}

          {/* 图标选择 */}
          <div className="form-group">
            <label className="form-label">图标</label>
            <div className="icon-selector">
              <button
                type="button"
                className="current-icon"
                onClick={() => setShowIconPicker(!showIconPicker)}
              >
                {formData.icon_type === 'url' ? (
                  <img 
                    src={formData.icon} 
                    alt="icon" 
                    className="w-6 h-6 rounded-md" 
                    style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                  />
                ) : (
                  <Icon icon={formData.icon || 'mdi:application'} />
                )}
                <span>选择图标</span>
              </button>

              {showIconPicker && (
                <div className="icon-picker">
                  <div className="icon-picker-header">
                    <input
                      type="text"
                      placeholder="输入 Iconify 图标名称 (如 mdi:home)"
                      value={customIcon}
                      onChange={(e) => setCustomIcon(e.target.value)}
                      className="input"
                    />
                    <button type="button" className="btn-secondary" onClick={handleCustomIconApply}>
                      应用
                    </button>
                  </div>
                  <div className="icon-grid">
                    {POPULAR_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${formData.icon === icon ? 'active' : ''}`}
                        onClick={() => handleIconSelect(icon)}
                      >
                        <Icon icon={icon} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 标题 */}
          <div className="form-group">
            <label className="form-label">标题 *</label>
            <input
              type="text"
              className="input"
              placeholder="卡片标题"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* 描述 */}
          <div className="form-group">
            <label className="form-label">描述</label>
            <input
              type="text"
              className="input"
              placeholder="简短描述（可选）"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* 内网地址 */}
          <div className="form-group">
            <label className="form-label">内网地址</label>
            <input
              type="text"
              className="input"
              placeholder="192.168.1.100:8080"
              value={formData.internal_url}
              onChange={(e) => setFormData({ ...formData, internal_url: e.target.value })}
              onBlur={(e) => handleUrlBlur(e.target.value)}
            />
          </div>

          {/* 外网地址 */}
          <div className="form-group">
            <div className="form-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>外网地址</label>
              <button 
                type="button" 
                className="btn-text-sm"
                onClick={() => {
                  const url = formData.external_url || '';
                  if (!url) {
                    toast.error('请先输入网址');
                    return;
                  }
                  handleUrlBlur(url);
                  toast.success('已尝试获取图标');
                }}
                disabled={!formData.external_url}
                title="尝试抓取该网站的图标"
                style={{ fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Icon icon="mdi:cloud-download" />
                获取图标
              </button>
            </div>
            <input
              type="text"
              className="input"
              placeholder="example.com"
              value={formData.external_url}
              onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
              onBlur={(e) => handleUrlBlur(e.target.value)}
            />
          </div>

          {/* 分组 */}
          <div className="form-group">
            <label className="form-label">
              分组
              <button 
                type="button" 
                className="btn-text-sm"
                onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--color-primary)' }}
              >
                {isCreatingGroup ? '选择已有分组' : '新建分组'}
              </button>
            </label>
            
            {isCreatingGroup ? (
              <input
                type="text"
                className="input"
                placeholder="输入新分组名称"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
              />
            ) : (
              <select
                className="input"
                value={formData.group_id || ''}
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">无分组</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* 选项 */}
          <div className="form-group form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.open_in_new_tab}
                onChange={(e) => setFormData({ ...formData, open_in_new_tab: e.target.checked })}
              />
              <span>新标签页打开</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.open_in_iframe}
                onChange={(e) => setFormData({ ...formData, open_in_iframe: e.target.checked })}
              />
              <span>小窗口打开</span>
            </label>
          </div>

          {/* 操作按钮 */}
          <div className="modal-actions">
            {card && onDelete && (
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Icon icon="mdi:delete" />
                删除
              </button>
            )}
            <div className="modal-actions-right">
              <button type="button" className="btn-secondary" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <Icon icon="mdi:loading" className="animate-spin" />
                ) : (
                  <Icon icon="mdi:check" />
                )}
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CardModal;
