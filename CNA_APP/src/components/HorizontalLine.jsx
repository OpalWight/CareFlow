import React from 'react';
import '../styles/HorizontalLine.css';

function HorizontalLine({ className = '' }) {
  return <div className={`horizontal-line ${className}`}></div>;
}

export default HorizontalLine;