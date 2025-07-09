import React from 'react';
import NavBar from './NavBar';
import Line from './lines';
import logo from '../assets/svg/logo.svg';
import { useNavigate } from 'react-router-dom';
import '../styles/Layout.css'

const Layout = ({ children, className, ...props }) => {
  const navigate = useNavigate();
  return (
    <div className={className} {...props}>
      <NavBar /> 
      {children}
    </div>
  );
};

export default Layout;