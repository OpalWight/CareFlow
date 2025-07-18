import React from 'react';
import '../../styles/interactive/TaskList.css';

function TaskList({ tasks }) {
  return (
    <div className="task-list-container">
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