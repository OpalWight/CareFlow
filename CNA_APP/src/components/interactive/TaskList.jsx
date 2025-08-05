import React, { useState, useRef, useEffect } from 'react';
import '../../styles/interactive/TaskList.css';

function TaskList({ tasks }) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 300, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, corner: '' });
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    // Only start drag if clicking on the container itself or title, not on task items, resize handle, or minimize button
    if (e.target.closest('.task-item') || e.target.closest('.task-progress-container') || e.target.closest('.resize-handle') || e.target.closest('.minimize-button')) {
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
        newWidth = Math.max(250, Math.min(800, resizeStart.width + deltaX));
      }
      if (corner.includes('left')) {
        newWidth = Math.max(250, Math.min(800, resizeStart.width - deltaX));
        newX = Math.min(position.x + deltaX, position.x + resizeStart.width - 250);
      }
      if (corner.includes('bottom')) {
        newHeight = Math.max(200, Math.min(600, resizeStart.height + deltaY));
      }
      if (corner.includes('top')) {
        newHeight = Math.max(200, Math.min(600, resizeStart.height - deltaY));
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

  const handleTaskClick = (task) => {
    // Don't trigger if the task is already completed
    if (task.completed) return;
    
    // Emit a custom event that can be caught by parent components
    const event = new CustomEvent('taskItemClicked', { 
      detail: { 
        taskId: task.id,
        taskName: task.name,
        task: task
      } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div 
      ref={containerRef}
      className={`task-list-container ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isMinimized ? 'minimized' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="task-list-header">
        <h3 className="task-list-title">
          📋 Task Checklist
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
          {tasks.length === 0 ? (
            <div className="task-list-empty">
              No tasks available
            </div>
          ) : (
            <ul className="task-list">
              {tasks.map((task, index) => (
                <li
                  key={task.id}
                  className="task-item"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className={`task-indicator ${task.completed ? 'completed' : 'pending'}`}>
                    {task.completed ? '✓' : index + 1}
                  </div>
                  
                  <span className={`task-text ${task.completed ? 'completed' : 'pending'}`}>
                    {task.name}
                  </span>
                  
                  {task.completed && (
                    <span className="task-completed-icon">
                      ✅
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          
          <div className="task-progress-container">
            <strong>Progress:</strong> {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
            
            <div className="task-progress-bar">
              <div 
                className="task-progress-fill"
                style={{
                  width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%`
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

export default TaskList;