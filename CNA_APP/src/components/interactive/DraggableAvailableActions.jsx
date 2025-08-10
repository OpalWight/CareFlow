import React, { useState, useRef, useEffect } from 'react';
import '../../styles/interactive/DraggableAvailableActions.css';

function DraggableAvailableActions({ steps, getActionButtons }) {
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 400 }); // Bottom-left
  const [size, setSize] = useState({ width: 350, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, corner: '' });
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    // Only start drag if clicking on the container header, not on action buttons, resize handle, or minimize button
    if (e.target.closest('.action-button') || e.target.closest('.resize-handle') || e.target.closest('.minimize-button')) {
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

  // Filter steps that have action buttons
  const actionableSteps = steps.filter(step => getActionButtons && getActionButtons(step));

  return (
    <div 
      ref={containerRef}
      className={`draggable-available-actions ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isMinimized ? 'minimized' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="available-actions-header">
        <h3 className="available-actions-title">
          🎯 Available Actions
        </h3>
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
          <div className="available-actions-content">
            {actionableSteps.length > 0 ? (
              <div className="action-buttons-grid">
                {actionableSteps.map((step) => {
                  const actionButton = getActionButtons(step);
                  if (actionButton) {
                    return (
                      <div key={step.id} className="action-button-container">
                        {actionButton}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <div className="no-actions-message">
                No actions available for this skill
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

export default DraggableAvailableActions;