import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginButton from './LoginButton';

function NavBar() {
  const navigate = useNavigate();
  return (
    <nav style={{ marginBottom: '20px' }}>
      <button onClick={() => navigate('/')}>Home</button>
      <button onClick={() => navigate('/flashcards')}>Flashcards</button>
      <button onClick={() => navigate('/chat-skills')}>Chat Skills Practice</button>
      <button onClick={() => navigate('/resources')}>Resources</button>
      <LoginButton />
    </nav>
  );
}

export default NavBar; 