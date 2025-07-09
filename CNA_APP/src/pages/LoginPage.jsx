import React, { useState, useEffect } from 'react';
import { useAuth } from '../api/AuthContext'; // ✅ ADDED: Import useAuth hook
import Layout from '../components/Layout';
import '../styles/LoginPage.css';

function LoginPage() {
    // ✅ ADDED: Get authentication state from AuthContext
    const { user, loading: authLoading, login, error: authError } = useAuth();
    
    // Local state for UI
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        // ✅ CHANGED: If user is already authenticated, redirect to dashboard
        if (user) {
            console.log('✅ User already authenticated, redirecting to dashboard');
            window.location.href = '/dashboard';
            return;
        }

        // ✅ SIMPLIFIED: Only handle OAuth error parameters (no token parsing needed)
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const newUser = urlParams.get('newUser');
        const accountLinked = urlParams.get('accountLinked');

        // ✅ ADDED: Handle success messages from OAuth redirect
        if (newUser === 'true') {
            setSuccessMessage('Welcome! Your Google account has been registered successfully.');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Redirect to dashboard after showing message
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } else if (accountLinked === 'true') {
            setSuccessMessage('Great! Your Google account has been linked to your existing account.');
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        }

        // Handle OAuth errors
        if (errorParam) {
            const errorMessages = {
                'access_denied': 'You denied access to your Google account.',
                'auth_failed': 'Authentication failed. Please try again.',
                'no_code': 'No authorization code received from Google.',
                'email_exists_or_google_id_exists': 'An account with this email already exists.',
                'invalid_data': 'Invalid user data received from Google.',
                'google_api_error': 'Failed to get user data from Google. Please try again.'
            };
            
            setError(errorMessages[errorParam] || 'An authentication error occurred.');
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // ✅ ADDED: Show auth errors from AuthContext
        if (authError) {
            setError(authError);
        }
    }, [user, authError]); // ✅ CHANGED: Dependencies updated

    // ✅ SIMPLIFIED: Use AuthContext login function
    function handleGoogleLogin() {
        console.log('🔄 Starting Google OAuth...');
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        // ✅ CHANGED: Use AuthContext login function instead of manual redirect
        login(); // This will redirect to http://localhost:3001/oauth
    }

    function clearError() {
        setError(null);
    }

    function clearSuccess() {
        setSuccessMessage(null);
    }

    // ✅ ADDED: Show loading state while checking authentication
    if (authLoading) {
        return (
            <Layout>
                <div className="login-container">
                    <div className="login-loading-message">
                        Checking authentication status...
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
        <div className="login-container">
            <h1>Login Page</h1>
            
            {successMessage && (
                <div className="login-success-message">
                    <strong>Success!</strong> {successMessage}
                    <button 
                        onClick={clearSuccess}
                        className="login-dismiss-success"
                    >
                        Dismiss
                    </button>
                </div>
            )}
            
            {error && (
                <div className="login-error-message">
                    <strong>Error:</strong> {error}
                    <button 
                        onClick={clearError}
                        className="login-dismiss-error"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {(loading || authLoading) && (
                <div className="login-loading-message">
                    Redirecting to Google for authentication...
                </div>
            )}

            <form className="login-form">
                <div className="login-form-group">
                    <input 
                        type="text" 
                        placeholder="Username" 
                        className="login-input login-input-username"
                    />
                </div>
                <div className="login-form-group">
                    <input 
                        type="password" 
                        placeholder="Password" 
                        className="login-input login-input-password"
                    />
                </div>
                <div className="login-form-actions">
                    <button type="button" className="login-btn login-btn-login">
                        Login
                    </button>
                    <button type="button" className="login-btn login-btn-signup">
                        Sign Up
                    </button>
                </div>
            </form>

            <div className="login-divider">
                <button 
                    onClick={handleGoogleLogin}
                    disabled={loading || authLoading} 
                    className={`login-google-btn${(loading || authLoading) ? ' login-google-btn-loading' : ''}`}
                >
                    {(loading || authLoading) ? 'Redirecting...' : (
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
        </Layout>
        
    );
}

export default LoginPage;