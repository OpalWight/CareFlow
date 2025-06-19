import React from 'react';
import { useNavigate } from 'react-router-dom';

function LoginButton() {
    const navigate = useNavigate();
    return (
        <button onClick={() => navigate('/login')}>
            Login
        </button>
    );
}

export default LoginButton;

