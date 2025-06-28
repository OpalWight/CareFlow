import React, { useState, useEffect } from 'react';
import NavBar from './NavBar';

function LoginPage() {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const errorParam = urlParams.get('error');
        const newUser = urlParams.get('newUser');
        const accountLinked = urlParams.get('accountLinked');

        if (token) {
            console.log('✅ Authentication successful! Token received.');
            localStorage.setItem('authToken', token);
            
            if (newUser === 'true') {
                setSuccessMessage('Welcome! Your Google account has been registered successfully.');
            } else if (accountLinked === 'true') {
                setSuccessMessage('Great! Your Google account has been linked to your existing account.');
            } else {
                setSuccessMessage('Welcome back! You have been logged in successfully.');
            }
            
            window.history.replaceState({}, document.title, window.location.pathname);
            
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
            
        } else if (errorParam) {
            const errorMessages = {
                'access_denied': 'You denied access to your Google account.',
                'auth_failed': 'Authentication failed. Please try again.',
                'no_code': 'No authorization code received from Google.',
                'email_exists': 'An account with this email already exists.',
                'invalid_data': 'Invalid user data received from Google.',
            };
            
            setError(errorMessages[errorParam] || 'An authentication error occurred.');
            setLoading(false);
            
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    function handleGoogleLogin() {
        console.log('🔄 Starting Google OAuth...');
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        window.location.href = "http://localhost:3001/request";
    }

    function clearError() {
        setError(null);
    }

    function clearSuccess() {
        setSuccessMessage(null);
    }

    return (
        <>
        <NavBar />
        <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
            <h1>Login Page</h1>
            
            {successMessage && (
                <div style={{ 
                    backgroundColor: '#e8f5e8', 
                    color: '#2e7d32', 
                    padding: '1rem', 
                    marginBottom: '1rem',
                    borderRadius: '4px',
                    border: '1px solid #81c784'
                }}>
                    <strong>Success!</strong> {successMessage}
                    <button 
                        onClick={clearSuccess}
                        style={{ 
                            marginLeft: '1rem', 
                            background: 'none', 
                            border: 'none', 
                            color: '#2e7d32',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Dismiss
                    </button>
                </div>
            )}
            
            {error && (
                <div style={{ 
                    backgroundColor: '#ffebee', 
                    color: '#c62828', 
                    padding: '1rem', 
                    marginBottom: '1rem',
                    borderRadius: '4px',
                    border: '1px solid #ef9a9a'
                }}>
                    <strong>Error:</strong> {error}
                    <button 
                        onClick={clearError}
                        style={{ 
                            marginLeft: '1rem', 
                            background: 'none', 
                            border: 'none', 
                            color: '#c62828',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {loading && (
                <div style={{ 
                    backgroundColor: '#e3f2fd', 
                    color: '#1976d2', 
                    padding: '1rem', 
                    marginBottom: '1rem',
                    borderRadius: '4px',
                    textAlign: 'center'
                }}>
                    Redirecting to Google for authentication...
                </div>
            )}

            <form style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <input 
                        type="text" 
                        placeholder="Username" 
                        style={{ 
                            width: '100%', 
                            padding: '0.5rem', 
                            marginBottom: '0.5rem' 
                        }} 
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <input 
                        type="password" 
                        placeholder="Password" 
                        style={{ 
                            width: '100%', 
                            padding: '0.5rem' 
                        }} 
                    />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" style={{ flex: 1, padding: '0.5rem' }}>
                        Login
                    </button>
                    <button type="button" style={{ flex: 1, padding: '0.5rem' }}>
                        Sign Up
                    </button>
                </div>
            </form>

            <div style={{ borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
                <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#4285f4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {loading ? 'Redirecting...' : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Sign in with Google
                        </>
                    )}
                </button>
            </div>
        </div>
        </>
        
    );
}

export default LoginPage;