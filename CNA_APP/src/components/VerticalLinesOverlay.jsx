import React from 'react';
import '../styles/VerticalLinesOverlay.css';

const VerticalLinesOverlay = ({ show = false, onToggle }) => {
  if (!show) return null;

  return (
    <div className="vertical-lines-overlay">
      <div className="vertical-line vertical-line-first"></div>
      <div className="vertical-line vertical-line-second"></div>
      {onToggle && (
        <button 
          className="vertical-lines-toggle"
          onClick={onToggle}
          title="Hide vertical lines"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default VerticalLinesOverlay;