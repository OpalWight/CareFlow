import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NavBar.css';
import logo from './assets/svg/logo.svg'

function NavBar() {
  const navigate = useNavigate();
  return (
    <>
    <nav className="navHeader" style={{ marginBottom: '20px' }}>
      <div className="rightHeader">
        <img className="homeLogo" src={logo} alt="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}/>
        <span className="button" onClick={() => navigate('/about-us')}>about us</span>
        <span className="button" onClick={() => navigate('/resources')}>resources</span>
      </div>
      <div className="leftHeader">
        <span className="button" onClick={() => navigate('/login')}>log in</span>
        <button className="get-started-button" onClick={() => navigate('/signup')}>get started</button>
      </div>
    </nav>
    <div className='dottedSep'></div>
    </>
  );
}

export default NavBar; 