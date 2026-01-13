import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode, cloneElement, isValidElement, ReactElement } from 'react';

interface SortableItemProps {
  id: string;
  children: ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {isValidElement(children) 
        ? cloneElement(children as ReactElement<{ dragListeners?: typeof listeners }>, { dragListeners: listeners })
        : children
      }
    </div>
  );
}
