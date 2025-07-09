import React from 'react';
import '../styles/GridLines.css';

const GridLines = ({ showVerticalLines = [], showHorizontalLines = [] }) => {
  return (
    <div className="grid-lines-container">
      {showVerticalLines.map((left, index) => (
        <div key={`vert-${index}`} className="grid-line vert" style={{ left: `${left}%` }}></div>
      ))}
      {showHorizontalLines.map((top, index) => (
        <div key={`horiz-${index}`} className="grid-line horiz" style={{ top: `${top}%` }}></div>
      ))}
    </div>
  );
};

export default GridLines;