import React, { useState, useRef, useEffect } from 'react';
import '../../styles/interactive/TaskList.css';

function TaskList({ tasks }) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    // Only start drag if clicking on the container itself or title, not on task items
    if (e.target.closest('.task-item') || e.target.closest('.task-progress-container')) {
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
    const maxX = window.innerWidth - 300; // TaskList width
    const maxY = window.innerHeight - 200; // Approximate min height
    
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
      className={`task-list-container ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <h3 className="task-list-title">
        📋 Task Checklist
      </h3>
      
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
    </div>
  );
}

export default TaskList;