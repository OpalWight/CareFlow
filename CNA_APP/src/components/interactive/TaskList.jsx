import React, { useState, useRef, useEffect } from 'react';
import '../../styles/interactive/TaskList.css';


function TaskList({ tasks }) {
  // Initialize with safe default position, will be updated by useEffect

  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 150, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, corner: '' });
  const [clickCooldowns, setClickCooldowns] = useState(new Set());
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
      
      // Get supply room container bounds
      const supplyRoomContainer = document.querySelector('.supply-room-container');
      let maxX, maxY, minX = 0, minY = 0;
      
      if (supplyRoomContainer) {
        const rect = supplyRoomContainer.getBoundingClientRect();
        minX = rect.left;
        minY = rect.top;
        maxX = rect.right - size.width;
        maxY = rect.bottom - size.height;
      } else {
        // Fallback to viewport bounds if supply room container not found
        maxX = window.innerWidth - size.width;
        maxY = window.innerHeight - size.height;
      }
      
      setPosition({
        x: Math.max(minX, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY))
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
        newWidth = Math.max(125, Math.min(400, resizeStart.width + deltaX));
      }
      if (corner.includes('left')) {
        newWidth = Math.max(125, Math.min(400, resizeStart.width - deltaX));
        newX = Math.min(position.x + deltaX, position.x + resizeStart.width - 125);
      }
      if (corner.includes('bottom')) {
        newHeight = Math.max(100, Math.min(300, resizeStart.height + deltaY));
      }
      if (corner.includes('top')) {
        newHeight = Math.max(100, Math.min(300, resizeStart.height - deltaY));
        newY = Math.min(position.y + deltaY, position.y + resizeStart.height - 100);
      }
      
      // Ensure resized component stays within supply room bounds
      const supplyRoomContainer = document.querySelector('.supply-room-container');
      if (supplyRoomContainer) {
        const rect = supplyRoomContainer.getBoundingClientRect();
        const maxResizeX = rect.right - newWidth;
        const maxResizeY = rect.bottom - newHeight;
        newX = Math.max(rect.left, Math.min(newX, maxResizeX));
        newY = Math.max(rect.top, Math.min(newY, maxResizeY));
      } else {
        // Fallback to viewport bounds
        const maxResizeX = window.innerWidth - newWidth;
        const maxResizeY = window.innerHeight - newHeight;
        newX = Math.max(0, Math.min(newX, maxResizeX));
        newY = Math.max(0, Math.min(newY, maxResizeY));
      }
      
      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Position component within supply room bounds after component mounts
  useEffect(() => {
    const positionWithinSupplyRoom = () => {
      const supplyRoomContainer = document.querySelector('.supply-room-container');
      if (supplyRoomContainer) {
        const rect = supplyRoomContainer.getBoundingClientRect();
        const newPosition = {
          x: rect.left + 20, // 20px from left edge of supply room
          y: rect.top + 20   // 20px from top edge of supply room
        };
        setPosition(newPosition);
      }
    };

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(positionWithinSupplyRoom, 100);
    
    return () => clearTimeout(timeoutId);
  }, []); // Run once on mount

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
    // Don't trigger if the task is already completed or on cooldown
    if (task.completed || clickCooldowns.has(task.id)) return;
    
    // Add task to cooldown
    setClickCooldowns(prev => new Set([...prev, task.id]));
    
    // Remove from cooldown after animation duration (6 seconds)
    setTimeout(() => {
      setClickCooldowns(prev => {
        const newCooldowns = new Set([...prev]);
        newCooldowns.delete(task.id);
        return newCooldowns;
      });
    }, 6000);
    
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
          📋 Item Checklist
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
                  className={`task-item ${clickCooldowns.has(task.id) ? 'on-cooldown' : ''}`}
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
                  
                  {clickCooldowns.has(task.id) && (
                    <span className="task-cooldown-icon">
                      ⏳
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          
          <div className="task-progress-container">
            <strong>Progress:</strong> {tasks.filter(t => t.completed).length} of {tasks.length} Items Collected
            
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