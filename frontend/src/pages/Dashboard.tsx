/**
 * 主仪表盘页面
 * 显示导航卡片、天气预报、支持卡片管理和小窗口预览
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { NavCard, SearchBar, Weather, CardModal, IframeModal, DateTime, Notepad, VercelGlobe, SystemMonitor, DockerPanel, Clock, TodoList, HealthCheck } from '../components';
import { cardsApi, groupsApi, settingsApi } from '../api';

import type { Card, CardCreate, CardUpdate, Group, Settings, SortItem } from '../types';
import toast from 'react-hot-toast';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent, 
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableCard } from '../components/SortableCard';
import { SortableGroup } from '../components/SortableGroup';
import './Dashboard.css';

export function Dashboard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotepad, setShowNotepad] = useState(false);
  const [showTodo, setShowTodo] = useState(false);
  
  // 卡片管理模态框状态
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  
  // Iframe 小窗口状态
  const [showIframe, setShowIframe] = useState(false);
  const [iframeCard, setIframeCard] = useState<Card | null>(null);
  
  const navigate = useNavigate();
  
  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: 聚焦搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
      
      // Ctrl/Cmd + B: 添加卡片
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleAddCard();
      }

      // Ctrl/Cmd + ,: 打开设置
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        navigate('/settings');
      }

      // Ctrl/Cmd + .: 切换备忘录
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        setShowNotepad(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  
  const loadData = async () => {
    try {
      const [cardsData, groupsData, settingsData] = await Promise.all([
        cardsApi.getAll(),
        groupsApi.getAll(),
        settingsApi.get()
      ]);
      
      setCards(cardsData);
      setGroups(groupsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * 切换内外网模式
   */
  const handleToggleNetwork = async () => {
    try {
      const newSettings = await settingsApi.toggleNetwork();
      setSettings(newSettings);
      toast.success(newSettings.use_external_url ? '已切换到外网模式' : '已切换到内网模式');
    } catch {
      toast.error('切换网络模式失败');
    }
  };
  
  /**
   * 保存卡片（新增或更新）
   */
  const handleSaveCard = async (data: CardCreate | CardUpdate) => {
    try {
      if (editingCard) {
        // 更新现有卡片
        const updated = await cardsApi.update(editingCard.id, data as CardUpdate);
        setCards(cards.map(c => c.id === editingCard.id ? updated : c));
        toast.success('卡片已更新');
      } else {
        // 创建新卡片
        const created = await cardsApi.create(data as CardCreate);
        setCards([...cards, created]);
        toast.success('卡片已添加');
      }
    } catch (error) {
      console.error('保存卡片失败:', error);
      toast.error('保存失败');
      throw error;
    }
  };
  
  /**
   * 删除卡片
   */
  const handleDeleteCard = async (id: number) => {
    try {
      await cardsApi.delete(id);
      setCards(cards.filter(c => c.id !== id));
      toast.success('卡片已删除');
    } catch (error) {
      console.error('删除卡片失败:', error);
      toast.error('删除失败');
      throw error;
    }
  };
  
  /**
   * 打开添加卡片模态框
   */
  const handleAddCard = () => {
    setEditingCard(null);
    setShowCardModal(true);
  };
  
  /**
   * 打开编辑卡片模态框
   */
  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setShowCardModal(true);
  };
  
  /**
   * 打开小窗口预览
   */
  const handleOpenIframe = (card: Card) => {
    setIframeCard(card);
    setShowIframe(true);
  };
  
  // ==================== 拖拽排序逻辑 ====================

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  
  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // 拖拽经过（处理跨组拖动的实时预览）
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    // 只处理卡片拖拽
    if (active.data.current?.type !== 'card') return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    
    // 如果没有变化，直接返回
    if (activeIdStr === overIdStr) return;

    // 找到 active 卡片
    const activeCard = cards.find(c => `card-${c.id}` === activeIdStr);
    if (!activeCard) return;

    const overType = over.data.current?.type;
    const overId = over.data.current?.id;
    let newGroupId: number | undefined | null = undefined;

    // 情况 1: 拖到了 Group Header 上
    if (overType === 'group') {
       newGroupId = overId; // Group ID
    } 
    // 情况 2: 拖到了另一张 Card 上
    else if (overType === 'card') {
       const overCard = cards.find(c => `card-${c.id}` === overIdStr);
       if (overCard) {
          newGroupId = overCard.group_id;
       }
    }
    
    // 只有当 Group ID 确实改变时才更新
    // 注意：activeCard.group_id 可能是 null (未分组)。newGroupId 也可能是 undefined(如果没拿到) 或 null (如果目标是未分组)
    // 这里如果 over 是未分组区域（假设我们也给了特定ID处理，或者默认 group_id 为空）
    
    // 如果 newGroupId 找到了，且不等于当前的
    if (newGroupId !== undefined && activeCard.group_id !== newGroupId) {
        setCards(prev => {
            return prev.map(c => {
                if (c.id === activeCard.id) {
                    return { ...c, group_id: newGroupId as number | undefined };
                }
                return c;
            });
        });
    }
  };

  // 拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const activeType = active.data.current?.type;
    
    // 处理分组排序
    if (activeType === 'group' && over.data.current?.type === 'group') {
        if (active.id !== over.id) {
            const oldIndex = groups.findIndex(g => `group-${g.id}` === active.id);
            const newIndex = groups.findIndex(g => `group-${g.id}` === over.id);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const newGroups = arrayMove(groups, oldIndex, newIndex);
                setGroups(newGroups);
                
                // API Call
                const sortItems: SortItem[] = newGroups.map((g, index) => ({
                    id: g.id,
                    sort_order: index
                }));
                try {
                   await groupsApi.updateSort(sortItems);
                } catch(e) { console.error(e); }
            }
        }
    }
    
    // 处理卡片排序
    if (activeType === 'card') {
        // 此时 cards 数组可能已经被 dragOver 修改过 group_id 了
        // 我们需要保存当前的顺序和分组状态
        
        // 简单策略：获取所有卡片的新顺序并保存
        // 但是我们需要先处理 arrayMove（如果是在同一组内拖动，或者跨组拖动到了特定位置）
        // activeId 是 `card-X`, over可能是 `card-Y` 或 `group-Z`
        
        const activeCardId = active.data.current?.id;
        
        // 如果拖到了 Group 上，通常 DragOver 已经把 group_id 改了，排序默认放在最后或保持原样。
        // 如果拖到了 Card 上，我们需要交换位置。
        if (over.data.current?.type === 'card' && active.id !== over.id) {
             const overCardId = over.data.current?.id;
             const oldIndex = cards.findIndex(c => c.id === activeCardId);
             const newIndex = cards.findIndex(c => c.id === overCardId);
             
             if (oldIndex !== -1 && newIndex !== -1) {
                 const newCards = arrayMove(cards, oldIndex, newIndex);
                 setCards(newCards);
                 
                 // 现在保存所有卡片的状态（包含新的 group_id 和 顺序）
                 saveAllCardsOrder(newCards);
                 return;
             }
        }
        
        // 如果只是改变了 Group 但没触发 ArrayMove (拖到了 Group Header)，或者没有发生交换
        // 我们仍需要保存变更（因为 group_id 变了）
        saveAllCardsOrder(cards);
    }
  };
  
  const saveAllCardsOrder = async (currentCards: Card[]) => {
      // 这里的策略是：按 Group 分组，然后生成 sort_order。
      // 全局 cards 列表的物理顺序可能已经乱了（因为 ArrayMove 是全局的）。
      // 但是我们在渲染时是 Filter by Group 的。
      // 所以我们应该：
      // 1. 遍历所有 Group，获取属于该 Group 的 Cards。
      // 2. 按 cards 数组中的出现顺序，给它们分配 sort_order 0, 1, 2...
      // 3. 同时处理未分组的。
      
      const sortItems: SortItem[] = [];
      const groupMap = new Map<number | string, number>(); // group_id -> current_counter
      
      // 初始化计数器
      groups.forEach(g => groupMap.set(g.id, 0));
      groupMap.set('ungrouped', 0);
      
      currentCards.forEach(card => {
          const gKey = card.group_id || 'ungrouped';
          const order = groupMap.get(gKey) || 0;
          
          sortItems.push({
              id: card.id,
              sort_order: order,
              group_id: card.group_id
          });
          
          groupMap.set(gKey, order + 1);
      });
      
      try {
          await cardsApi.updateSort(sortItems);
      } catch (e) {
          toast.error('保存排序失败');
      }
  };

  /**
   * 按分组整理卡片
   */
  const getCardsByGroup = () => {
    const ungrouped = cards.filter(card => !card.group_id);
    const grouped = groups.map(group => ({
      group,
      cards: cards.filter(card => card.group_id === group.id)
    }));
    
    return { ungrouped, grouped };
  };
  
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <Icon icon="mdi:loading" className="animate-spin" />
        <span>加载中...</span>
      </div>
    );
  }
  
  const { ungrouped, grouped } = getCardsByGroup();
  
  return (
    <div 
      className="dashboard"
      style={{
        '--wallpaper': settings?.wallpaper?.startsWith('linear') 
          ? 'none' 
          : settings?.wallpaper ? `url(${settings.wallpaper})` : 'none',
        '--wallpaper-blur': `${settings?.wallpaper_blur || 0}px`
      } as React.CSSProperties}
    >
      {/* 背景 */}
      <div 
        className="dashboard-background"
        style={{
          background: settings?.wallpaper?.startsWith('linear') ? settings.wallpaper : undefined
        }}
      >
        {settings?.wallpaper && !settings.wallpaper.startsWith('linear') ? (
          <div className="dashboard-bg-image" />
        ) : (
          <VercelGlobe />
        )}
        <div className="dashboard-bg-overlay" />
      </div>
      
      {/* 顶部导航 */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          {(settings?.show_notepad ?? true) && (
            <button className="btn-icon" onClick={() => setShowNotepad(true)} title="备忘录">
              <Icon icon="mdi:note-text" />
            </button>
          )}
          <button className="btn-icon" onClick={() => setShowTodo(true)} title="待办事项">
            <Icon icon="mdi:checkbox-marked-circle-outline" />
          </button>
          <h1 className="dashboard-title">
            <Icon icon="mdi:view-dashboard" />
            Jun-Panel
          </h1>
        </div>
        
        <div className="dashboard-header-right">
          {/* 设置按钮 */}
          <button className="btn-icon" onClick={() => navigate('/settings')} title="设置">
            <Icon icon="mdi:cog" />
          </button>
          
          {/* 内外网切换 */}
          <button 
            className={`network-toggle ${settings?.use_external_url ? 'external' : 'internal'}`}
            onClick={handleToggleNetwork}
            title={settings?.use_external_url ? '当前：外网模式' : '当前：内网模式'}
          >
            <Icon icon={settings?.use_external_url ? 'mdi:earth' : 'mdi:home-network'} />
            <span>{settings?.use_external_url ? '外网' : '内网'}</span>
          </button>
        </div>
      </header>
      
      {/* 主内容区 */}
      <main className="dashboard-main">
        {/* 日期时间显示 */}
        <DateTime />
        
        {/* 搜索框 */}
        <div className="dashboard-search">
          <SearchBar defaultEngine={settings?.search_engine || 'google'} />
        </div>
        
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart} 
          onDragOver={handleDragOver} 
          onDragEnd={handleDragEnd}
        >
          <section className="dashboard-cards">
            {/* 未分组的卡片 - 视为一个特殊的区域，不参与分组排序，但内部卡片可排序 */}
            {ungrouped.length > 0 && (
              <SortableContext items={ungrouped.map(c => `card-${c.id}`)} strategy={rectSortingStrategy}>
                <div className="card-grid" style={{ marginBottom: '2rem' }}>
                  {ungrouped.map(card => (
                    <SortableCard
                      key={card.id}
                      id={card.id}
                      card={card}
                      settings={settings}
                      onEdit={handleEditCard}
                      onDelete={(c) => handleDeleteCard(c.id)}
                      onOpenIframe={handleOpenIframe}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
            
            {/* 分组区域 - 分组本身可排序 */}
            <SortableContext items={groups.map(g => `group-${g.id}`)} strategy={verticalListSortingStrategy}>
              {grouped.map(({ group, cards: groupCards }) => (
                <SortableGroup key={group.id} group={group} count={groupCards.length}>
                  <SortableContext items={groupCards.map(c => `card-${c.id}`)} strategy={rectSortingStrategy}>
                    {groupCards.map(card => (
                      <SortableCard
                        key={card.id}
                        id={card.id}
                        card={card}
                        settings={settings}
                        onEdit={handleEditCard}
                        onDelete={(c) => handleDeleteCard(c.id)}
                        onOpenIframe={handleOpenIframe}
                      />
                    ))}
                  </SortableContext>
                </SortableGroup>
              ))}
            </SortableContext>
            
            {/* 拖拽时的遮罩层（预览） */}
            <DragOverlay adjustScale={true}>
              {activeId ? (
                (() => {
                  if (activeId.startsWith('group')) {
                     const gid = parseInt(activeId.split('-')[1]);
                     const group = groups.find(g => g.id === gid);
                     if (!group) return null;
                     return (
                        <div className="card-group" style={{ opacity: 0.8 }}>
                           <div className="card-group-header">
                              {group.icon && <Icon icon={group.icon} />}
                              <span>{group.name}</span>
                           </div>
                        </div>
                     );
                  } else {
                     const cid = parseInt(activeId.split('-')[1]);
                     const card = cards.find(c => c.id === cid);
                     if (!card) return null;
                     return (
                       <div style={{ transform: 'scale(1.05)', cursor: 'grabbing' }}>
                         <NavCard card={card} settings={settings} />
                       </div>
                     );
                  }
                })()
              ) : null}
            </DragOverlay>

            {/* 空状态 */}
            {cards.length === 0 && (
              <div className="dashboard-empty">
                <Icon icon="mdi:view-grid-plus" />
                <h3>还没有导航卡片</h3>
                <p>点击右下角的按钮添加第一个导航卡片</p>
                <button className="btn-primary" onClick={handleAddCard}>
                  <Icon icon="mdi:plus" />
                  添加卡片
                </button>
              </div>
            )}
          </section>
        </DndContext>
        
        {/* 侧边栏 - 天气预报和系统状态 */}
        <aside className="dashboard-sidebar show">
          <Clock />
          {(settings?.show_weather ?? true) && <Weather />}
          {(settings?.show_system_monitor ?? true) && <SystemMonitor />}
          {(settings?.show_docker_panel ?? true) && <DockerPanel />}
          <HealthCheck />
        </aside>
      </main>
      
      {/* 添加按钮 */}
      <button className="fab-add" onClick={handleAddCard}>
        <Icon icon="mdi:plus" />
      </button>
      
      {/* 卡片管理模态框 */}
      <CardModal
        isOpen={showCardModal}
        card={editingCard}
        groups={groups}
        onClose={() => setShowCardModal(false)}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
      />
      
      {/* Iframe 小窗口 */}
      <IframeModal
        isOpen={showIframe}
        card={iframeCard}
        settings={settings}
        onClose={() => setShowIframe(false)}
      />
      
      {/* 快捷备忘录 */}
      {(settings?.show_notepad ?? true) && (
        <Notepad
          isOpen={showNotepad}
          onClose={() => setShowNotepad(false)}
        />
      )}
      
      {/* 待办事项 */}
      <TodoList
        isOpen={showTodo}
        onClose={() => setShowTodo(false)}
      />
    </div>
  );
}

export default Dashboard;
