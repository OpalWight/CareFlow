import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/navbar.css';
import logo from '../assets/svg/logo.svg';
import { useAuth } from '../api/AuthContext';
import redBalloonPfp from '../assets/svg/redBalloonPfp.svg';
import GetStartedButton from './GetStartedButton';
import HorizontalLine from './HorizontalLine';

import '../styles/Layout.css';

function NavBar() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  return (
    <>
    <nav className="navHeader" >
      <div className="rightHeader">
        <img className="homeLogo" src={logo} alt="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}/>
        <span className="button" onClick={() => navigate('/about-us')}>about us</span>
        {isAuthenticated ? (
          <>
            <span className="button" onClick={() => navigate('/quiz')}>quiz mode</span>
          </>
        ) : (
          <>
            <span className="button" onClick={() => navigate('/signup')}>get started</span>
          </>
        )}
      </div>
      <div className="leftHeader">
        {isAuthenticated ? (
          <>
            <span className="button" onClick={() => navigate('/help')}>Help</span>
            <span className="button" onClick={() => navigate('/settings')}>Settings</span>
            {isAdmin && (
              <span className="button admin-button" onClick={() => navigate('/admin')}>
                🛠️ Admin
              </span>
            )}
            <button className="profile-button" onClick={() => navigate('/dashboard')}>
              <img src={redBalloonPfp} alt="Profile" />
            </button>
          </>
        ) : (
          <>
            <span className="button" onClick={() => navigate('/login')}>log in</span>
            <GetStartedButton />
          </>
        )}
      </div>
    </nav>
    <HorizontalLine />
    </>
  );
}

export default NavBar;