import React, { useState, useRef, useEffect } from 'react';
import DropZone from './DropZone';
import '../../styles/interactive/DraggableSupplyCollection.css';

function DraggableSupplyCollection() {
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 20 }); // Top-right corner
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    // Only start drag if clicking on the container header or border, not on the drop zone
    if (e.target.closest('.drop-zone')) {
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
    const maxX = window.innerWidth - 300; // Collection area width
    const maxY = window.innerHeight - 180; // Approximate min height
    
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

  return (
    <div 
      ref={containerRef}
      className={`draggable-supply-collection ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="collection-header">
        <span className="collection-title">📦 Supply Collection</span>
        <span className="drag-hint">Drag to move</span>
      </div>
      
      <DropZone 
        id="supply-collector"
        label="Drop supplies here"
        style={{
          minHeight: '100px',
          backgroundColor: '#fff3cd',
          borderColor: '#ffc107'
        }}
      >
        <div className="collection-icon">📦</div>
        <div className="collection-text">
          Drop collected supplies here
        </div>
      </DropZone>
    </div>
  );
}

export default DraggableSupplyCollection;