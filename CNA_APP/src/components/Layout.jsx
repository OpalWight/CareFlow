import React from 'react';
import NavBar from './NavBar';

import GridLines from './GridLines';
import logo from '../assets/svg/logo.svg';
import { useNavigate } from 'react-router-dom';
import '../styles/Layout.css'

const Layout = ({ children, className, showVerticalLines = [10, 20, 30, 40, 50, 60, 70, 80, 90], showHorizontalLines = [10, 20, 30, 40, 50, 60, 70, 80, 90], ...props }) => {
  const navigate = useNavigate();
  return (
    <div className={className} {...props}>
      <NavBar /> 
      <GridLines 
        showVerticalLines={showVerticalLines} 
        showHorizontalLines={showHorizontalLines} 
      />
      {children}
    </div>
  );
};

export default Layout;