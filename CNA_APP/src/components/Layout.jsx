import React, { useState } from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import HorizontalLine from './HorizontalLine';
import VerticalLinesOverlay from './VerticalLinesOverlay';

import GridLines from './GridLines';
import logo from '../assets/svg/logo.svg';
import { useNavigate } from 'react-router-dom';
import '../styles/Layout.css'

const Layout = ({ 
  children, 
  className, 
  showVerticalLines = [], 
  showHorizontalLines = [], 
  enableVerticalLinesToggle = false,
  verticalLinesDefaultVisible = false,
  ...props 
}) => {
  const navigate = useNavigate();
  const [showVerticalLinesOverlay, setShowVerticalLinesOverlay] = useState(verticalLinesDefaultVisible);

  const toggleVerticalLines = () => {
    setShowVerticalLinesOverlay(!showVerticalLinesOverlay);
  };

  return (
    <div className={`layout-container ${className || ''}`} {...props}>
      <NavBar /> 
      <VerticalLinesOverlay 
        show={enableVerticalLinesToggle ? showVerticalLinesOverlay : false}
        onToggle={enableVerticalLinesToggle ? toggleVerticalLines : null}
      />
      <GridLines 
        showVerticalLines={showVerticalLines} 
        showHorizontalLines={showHorizontalLines} 
      />
      {/* Show toggle button when vertical lines are hidden */}
      {enableVerticalLinesToggle && !showVerticalLinesOverlay && (
        <button 
          className="show-vertical-lines-toggle"
          onClick={toggleVerticalLines}
          title="Show vertical lines"
        >
          ⚏
        </button>
      )}
      {children}
      <HorizontalLine />
      <Footer />
    </div>
  );
};

export default Layout;