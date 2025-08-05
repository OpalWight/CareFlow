import React, { useState, useRef, useEffect } from 'react';
import DraggableItem from './DraggableItem';
import '../../styles/interactive/DraggableCollectedSupplies.css';

function DraggableCollectedSupplies({ collectedSupplies }) {
  const [position, setPosition] = useState({ x: 20, y: 120 }); // Top-left corner, below header
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    // Only start drag if clicking on the header or container, not on draggable items
    if (e.target.closest('.draggable-item') || e.target.closest('.collected-supplies-grid')) {
      return;
    }
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Constrain to viewport bounds
    const maxX = window.innerWidth - 320; // Collected supplies width
    const maxY = window.innerHeight - 250; // Approximate height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Don't render if no supplies collected
  if (!collectedSupplies || collectedSupplies.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`draggable-collected-supplies ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="collected-header">
        <span className="collected-title">📦 Collected Supplies</span>
        <span className="supply-count">{collectedSupplies.length}</span>
        <span className="drag-hint">Drag to move</span>
      </div>
      
      <div className="collected-supplies-grid">
        {collectedSupplies.map(supply => (
          <DraggableItem 
            key={`collected-${supply.id}`}
            id={supply.id}
            name={supply.name}
            isCollected={true}
          />
        ))}
      </div>
    </div>
  );
}

export default DraggableCollectedSupplies;