import React, { useState, useRef, useEffect } from 'react';
import '../../styles/interactive/DraggableProcedureSteps.css';

function DraggableProcedureSteps({ steps, completedSteps, getActionButtons }) {
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 450 }); // Bottom-right
  const [size, setSize] = useState({ width: 400, height: 350 });
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
        newWidth = Math.max(300, Math.min(800, resizeStart.width + deltaX));
      }
      if (corner.includes('left')) {
        newWidth = Math.max(300, Math.min(800, resizeStart.width - deltaX));
        newX = Math.min(position.x + deltaX, position.x + resizeStart.width - 300);
      }
      if (corner.includes('bottom')) {
        newHeight = Math.max(250, Math.min(600, resizeStart.height + deltaY));
      }
      if (corner.includes('top')) {
        newHeight = Math.max(250, Math.min(600, resizeStart.height - deltaY));
        newY = Math.min(position.y + deltaY, position.y + resizeStart.height - 250);
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

  const isStepCompleted = (stepId) => completedSteps.includes(stepId);

  return (
    <div 
      ref={containerRef}
      className={`draggable-procedure-steps ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isMinimized ? 'minimized' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="procedure-steps-header">
        <h3 className="procedure-steps-title">
          📋 Procedure Steps
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
          <div className="procedure-steps-content">
            <ol className="procedure-steps-list">
              {steps.map((step, index) => (
                <li 
                  key={step.id} 
                  className={`procedure-step-item ${isStepCompleted(step.id) ? 'completed-step' : 'pending-step'}`}
                >
                  <div className="step-content">
                    <span className="step-number">
                      {isStepCompleted(step.id) ? '✅' : `${index + 1}.`}
                    </span>
                    <span className="step-text">
                      {step.name}
                    </span>
                  </div>
                  {getActionButtons && getActionButtons(step) && (
                    <div className="step-action-button">
                      {getActionButtons(step)}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
          
          <div className="procedure-progress">
            <div className="progress-text">
              Progress: {completedSteps.length} / {steps.length} steps completed
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{
                  width: `${(completedSteps.length / steps.length) * 100}%`,
                  backgroundColor: completedSteps.length === steps.length ? '#4caf50' : '#2196f3'
                }}
              />
            </div>
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

export default DraggableProcedureSteps;