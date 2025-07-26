import React, { useState, useEffect } from 'react';
import { useAuth } from '../api/AuthContext';
import Layout from '../components/Layout';
import '../styles/SignUp.css';

function SignUp() {
    const { user, loading: authLoading, registerWithEmail, loginWithGoogle, error: authError } = useAuth();
    
    // Local state for UI
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    
    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        // If user is already authenticated, redirect to dashboard
        if (user) {
            console.log('✅ User already authenticated, redirecting to dashboard');
            window.location.href = '/dashboard';
            return;
        }

        // Show auth errors from AuthContext
        if (authError) {
            setError(authError);
        }
    }, [user, authError]);

    // Handle email/password registration
    const handleEmailSignup = async (e) => {
        e.preventDefault();
        
        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const result = await registerWithEmail(name, email, password);
            
            if (result.success) {
                setSuccessMessage('Registration successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Google signup
    function handleGoogleSignup() {
        console.log('🔄 Starting Google OAuth signup...');
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        loginWithGoogle(); // Same as login, Google handles signup
    }

    function clearError() {
        setError(null);
    }

    function clearSuccess() {
        setSuccessMessage(null);
    }

    // Show loading state while checking authentication
    if (authLoading) {
        return (
            <Layout>
                <div className="signup-container">
                    <div className="signup-loading-message">
                        <div id="signup-loading-message-div">Checking authentication status...</div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="signup-container">
                <h1>Sign Up</h1>
                
                {successMessage && (
                    <div className="signup-success-message">
                        <strong id="signup-success-strong">Success!</strong> {successMessage}
                        <button 
                            onClick={clearSuccess}
                            className="signup-dismiss-success"
                        >
                            ×
                        </button>
                    </div>
                )}
                
                {error && (
                    <div className="signup-error-message">
                        <strong id="signup-error-strong">Error:</strong> {error}
                        <button 
                            onClick={clearError}
                            className="signup-dismiss-error"
                        >
                            ×
                        </button>
                    </div>
                )}

                {(loading || authLoading) && (
                    <div className="signup-loading-message">
                        <div id="signup-loading-message-creating-account-div">Creating your account...</div>
                    </div>
                )}

                <form className="signup-form" onSubmit={handleEmailSignup}>
                    <div className="signup-form-group">
                        <input 
                            id="signup-name-input"
                            type="text" 
                            placeholder="Full Name" 
                            className="signup-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={loading || authLoading}
                        />
                    </div>
                    <div className="signup-form-group">
                        <input 
                            id="signup-email-input"
                            type="email" 
                            placeholder="Email" 
                            className="signup-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading || authLoading}
                        />
                    </div>
                    <div className="signup-form-group">
                        <input 
                            id="signup-password-input"
                            type="password" 
                            placeholder="Password (at least 6 characters)" 
                            className="signup-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6"
                            disabled={loading || authLoading}
                        />
                    </div>
                    <div className="signup-form-group">
                        <input 
                            id="signup-confirm-password-input" 
                            type="password" 
                            placeholder="Confirm Password" 
                            className="signup-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading || authLoading}
                        />
                    </div>
                    <div className="signup-form-actions">
                        <button 
                            type="submit" 
                            className="signup-btn signup-btn-primary"
                            disabled={loading || authLoading}
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                        <button 
                            type="button" 
                            className="signup-btn signup-btn-secondary"
                            onClick={() => window.location.href = '/login'}
                            disabled={loading || authLoading}
                        >
                            Back to Login
                        </button>
                    </div>
                </form>

                <div className="signup-divider"></div>

                <button 
                    onClick={handleGoogleSignup}
                    disabled={loading || authLoading} 
                    className="signup-google-btn"
                >
                    {(loading || authLoading) ? 'Redirecting...' : (
                        <>
                            <svg id="signup-google-svg" width="18" height="18" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Sign up with Google
                        </>
                    )}
                </button>
            </div>
        </Layout>
    );
}

export default SignUp;