import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GetStartedButton.css';

function GetStartedButton() {
  const navigate = useNavigate();

  return (
    <button className="get-started-button" onClick={() => navigate('/signup')}>get started</button>
  );
}

export default GetStartedButton;
