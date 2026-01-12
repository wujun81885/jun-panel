import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import NavCard, { type NavCardProps } from './NavCard';

interface SortableCardProps extends NavCardProps {
  id: number;
}

export function SortableCard({ id, ...props }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `card-${id}`, data: { type: 'card', id, group_id: props.card.group_id } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NavCard {...props} />
    </div>
  );
}
