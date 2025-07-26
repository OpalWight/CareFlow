import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import HorizontalLine from './HorizontalLine';

import GridLines from './GridLines';
import logo from '../assets/svg/logo.svg';
import { useNavigate } from 'react-router-dom';
import '../styles/Layout.css'

const Layout = ({ children, className, showVerticalLines = [], showHorizontalLines = [], ...props }) => {
  const navigate = useNavigate();
  return (
    <div className={className} {...props}>
      <NavBar /> 
      <GridLines 
        showVerticalLines={showVerticalLines} 
        showHorizontalLines={showHorizontalLines} 
      />
      {children}
      <HorizontalLine />
      <Footer />
    </div>
  );
};

export default Layout;