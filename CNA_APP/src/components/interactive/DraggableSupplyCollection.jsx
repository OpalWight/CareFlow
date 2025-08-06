import React, { useState, useRef, useEffect } from 'react';
import DropZone from './DropZone';
import DraggableItem from './DraggableItem';
import '../../styles/interactive/DraggableSupplyCollection.css';

function DraggableSupplyCollection({ collectedSupplies = [] }) {
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 20 }); // Top-right corner
  const [size, setSize] = useState({ width: 320, height: 250 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, corner: '' });
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    // Only start drag if clicking on the container header or border, not on interactive elements, resize handle, or minimize button
    if (e.target.closest('.drop-zone') || e.target.closest('.draggable-item') || e.target.closest('.collected-supplies-grid') || e.target.closest('.resize-handle') || e.target.closest('.minimize-button')) {
      return;
    }
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleResizeMouseDown = (corner) => (e) => {
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      corner: corner
    });
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMinimizeClick = () => {
    setIsMinimized(!isMinimized);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain to viewport bounds
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
    
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = position.x;
      let newY = position.y;
      
      const { corner } = resizeStart;
      
      if (corner.includes('right')) {
        newWidth = Math.max(280, Math.min(600, resizeStart.width + deltaX));
      }
      if (corner.includes('left')) {
        newWidth = Math.max(280, Math.min(600, resizeStart.width - deltaX));
        newX = Math.min(position.x + deltaX, position.x + resizeStart.width - 280);
      }
      if (corner.includes('bottom')) {
        newHeight = Math.max(200, Math.min(500, resizeStart.height + deltaY));
      }
      if (corner.includes('top')) {
        newHeight = Math.max(200, Math.min(500, resizeStart.height - deltaY));
        newY = Math.min(position.y + deltaY, position.y + resizeStart.height - 200);
      }
      
      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  return (
    <div 
      ref={containerRef}
      className={`draggable-supply-collection ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isMinimized ? 'minimized' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="collection-header">
        <span className="collection-title">📦 Supply Management</span>
        <span className="supply-count">{collectedSupplies.length}</span>
        <span className="drag-hint">Drag to move</span>
        <button 
          className="minimize-button"
          onClick={handleMinimizeClick}
          title={isMinimized ? "Expand" : "Minimize"}
        >
          {isMinimized ? '▢' : '─'}
        </button>
      </div>
      {!isMinimized && (
        <>
          {/* Drop Zone Section */}
          <DropZone 
            id="supply-collector"
            label="Drop supplies here"
            style={{
              minHeight: '80px',
              backgroundColor: '#fff3cd',
              borderColor: '#ffc107'
            }}
          >
            <div className="collection-icon">📦</div>
            <div className="collection-text">
              Drop supplies here
            </div>
          </DropZone>
          
          {/* Collected Supplies Section */}
          <div className="collected-supplies-section">
            <div className="collected-supplies-header">
              <span className="collected-title">Collected Items:</span>
            </div>
            
            {collectedSupplies.length > 0 ? (
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
            ) : (
              <div className="no-supplies-message">
                No supplies collected yet
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Four corner resize handles */}
      {!isMinimized && (
        <>
          <div className="resize-handle top-left" onMouseDown={handleResizeMouseDown('top-left')} />
          <div className="resize-handle top-right" onMouseDown={handleResizeMouseDown('top-right')} />
          <div className="resize-handle bottom-left" onMouseDown={handleResizeMouseDown('bottom-left')} />
          <div className="resize-handle bottom-right" onMouseDown={handleResizeMouseDown('bottom-right')} />
        </>
      )}
    </div>
  );
}

export default DraggableSupplyCollection;