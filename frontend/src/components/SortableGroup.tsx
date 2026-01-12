import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from '@iconify/react';
import type { Group } from '../types';

interface SortableGroupProps {
  group: Group;
  count: number;
  children: React.ReactNode;
}

export function SortableGroup({ group, count, children }: SortableGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `group-${group.id}`,
    data: { type: 'group', id: group.id }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
    position: 'relative' as const, // 确保定位
  };

  return (
    <div ref={setNodeRef} style={style} className="card-group">
      {/* 分组标题作为拖拽手柄 */}
      <div 
        className="card-group-header" 
        {...attributes} 
        {...listeners}
        style={{ cursor: 'grab' }}
      >
        {group.icon && <Icon icon={group.icon} />}
        <span>{group.name}</span>
        <span className="card-group-count">{count}</span>
      </div>
      <div className="card-grid">
        {children}
      </div>
    </div>
  );
}
