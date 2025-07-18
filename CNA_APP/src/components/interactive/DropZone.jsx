import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import '../../styles/interactive/DropZone.css';

function DropZone({ id, children, label, isActive = false, style = {} }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const className = `drop-zone ${isActive ? 'active' : ''} ${isOver ? 'over' : ''}`;

  return (
    <div ref={setNodeRef} className={className} style={style}>
      {label && (
        <div className="drop-zone-label">
          {label}
        </div>
      )}
      {children}
      {isOver && (
        <div className="drop-zone-overlay">
          Drop here
        </div>
      )}
    </div>
  );
}

export default DropZone;