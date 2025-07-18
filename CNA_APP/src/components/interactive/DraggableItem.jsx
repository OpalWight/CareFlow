import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import '../../styles/interactive/DraggableItem.css';

const SUPPLY_ICONS = {
  gloves: '🧤',
  bandage: '🩹',
  antiseptic: '🧴',
  gauze: '🏥'
};

function DraggableItem({ id, name, isDragging = false, isCollected = false }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  const className = `draggable-item ${isCollected ? 'collected' : ''} ${isDragging ? 'dragging' : ''}`;

  const icon = SUPPLY_ICONS[id] || '📦';

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={style}
      {...listeners}
      {...attributes}
    >
      <span className="draggable-item-icon">{icon}</span>
      <span>{name}</span>
    </div>
  );
}

export default DraggableItem;