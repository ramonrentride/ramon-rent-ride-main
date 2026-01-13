import { ReactNode, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface SortableContainerProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  children: ReactNode;
  renderOverlay?: (activeItem: T) => ReactNode;
  strategy?: 'grid' | 'vertical';
}

export function SortableContainer<T extends { id: string }>({
  items,
  onReorder,
  children,
  renderOverlay,
  strategy = 'grid',
}: SortableContainerProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find((i) => i.id === event.active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay>
        {activeItem && renderOverlay ? (
          <div className="opacity-80 shadow-xl scale-105 rotate-2">
            {renderOverlay(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
