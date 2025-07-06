import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/navbar.css';
import logo from '../assets/svg/logo.svg';
import { useAuth } from '../api/AuthContext';
import redBalloonPfp from '../assets/svg/redBalloonPfp.svg';

function NavBar() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <>
    <nav className="navHeader" >
      <div className="rightHeader">
        <img className="homeLogo" src={logo} alt="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}/>
        <span className="button" onClick={() => navigate('/about-us')}>about us</span>
        <span className="button" onClick={() => navigate('/resources')}>resources</span>
        <span className="button" onClick={() => navigate('/chat')}>chat skills</span>
      </div>
      <div className="leftHeader">
        {isAuthenticated ? (
          <>
            <span className="button" onClick={() => navigate('/help')}>Help</span>
            <span className="button" onClick={() => navigate('/settings')}>Settings</span>
            <button className="profile-button" onClick={() => navigate('/dashboard')}>
              <img src={redBalloonPfp} alt="Profile" />
            </button>
          </>
        ) : (
          <>
            <span className="button" onClick={() => navigate('/login')}>log in</span>
            <button className="get-started-button" onClick={() => navigate('/signup')}>get started</button>
          </>
        )}
      </div>
    </nav>
    <div className='dottedSep'></div>
    </>
  );
}

export default NavBar; 