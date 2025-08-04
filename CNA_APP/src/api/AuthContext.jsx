import React, { createContext, useContext, useState, useEffect } from 'react';

// ✅ Step 1: Create the AuthContext - this is the "empty container"
const AuthContext = createContext();

// ✅ Step 2: Custom hook to use the AuthContext - this is the "easy access" function
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// ✅ Step 3: AuthProvider component - this fills the container with data and functions
export const AuthProvider = ({ children }) => {
    // State management for authentication
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Check if user is authenticated by verifying cookie with backend
    const checkAuth = async () => {
        try {
            setLoading(true);
            console.log('🔍 Checking authentication status...');
            console.log('🔍 DEBUG: Frontend environment detection:');
            console.log('  - VITE_API_URL:', import.meta.env.VITE_API_URL);
            console.log('  - VITE_ENV:', import.meta.env.VITE_ENV);
            console.log('  - MODE:', import.meta.env.MODE);
            console.log('  - PROD:', import.meta.env.PROD);
            console.log('  - DEV:', import.meta.env.DEV);
            
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            console.log('🔍 DEBUG: Using API URL:', apiUrl);
            
            const response = await fetch(`${apiUrl}/oauth/verify`, {
                method: 'GET',
                credentials: 'include', // ✅ This sends HTTP-only cookies automatically
                headers: {
                    'Content-Type': 'application/json'
                }
                // ❌ NO Authorization header needed - cookies handle this!
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setError(null);
                console.log('✅ User authenticated via cookie:', data.user.email);
                return true;
            } else {
                setUser(null);
                // If the error is 401 or 403, it's an expected auth failure (e.g., invalid/expired token).
                // We log it but don't set a user-facing error unless they were previously logged in.
                if (response.status === 401 || response.status === 403) {
                    console.log('❌ Authentication failed (invalid/expired token), clearing session.');
                    if (user) { // Only show error if a user was already logged in.
                        setError('Session expired. Please log in again.');
                    }
                } else {
                    // For other errors (e.g., 500), we might want to show a generic error.
                    setError('Authentication check failed. Please try again later.');
                }
                return false;
            }
        } catch (err) {
            console.error('❌ Auth check error:', err);
            setUser(null);
            setError(`Network error: ${err.message}`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // ✅ Login with email and password
    const loginWithEmail = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            console.log('🔐 Attempting email/password login...');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                console.log('✅ Email login successful:', data.user.email);
                return { success: true, user: data.user };
            } else {
                const errorMessage = data.message || 'Login failed';
                setError(errorMessage);
                return { success: false, error: errorMessage };
            }
        } catch (err) {
            console.error('❌ Email login error:', err);
            const errorMessage = `Network error: ${err.message}`;
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // ✅ Register with email and password
    const registerWithEmail = async (name, email, password) => {
        try {
            setLoading(true);
            setError(null);
            console.log('📝 Attempting email registration...');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/register`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                console.log('✅ Registration successful:', data.user.email);
                return { success: true, user: data.user };
            } else {
                const errorMessage = data.message || 'Registration failed';
                setError(errorMessage);
                return { success: false, error: errorMessage };
            }
        } catch (err) {
            console.error('❌ Registration error:', err);
            const errorMessage = `Network error: ${err.message}`;
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // ✅ Login with Google OAuth: Redirect to Google OAuth (backend handles cookie setting)
    const loginWithGoogle = () => {
        console.log('🚀 Initiating Google OAuth login...');
        // Redirect to your backend OAuth endpoint
        // After successful OAuth, backend will:
        // 1. Set HTTP-only cookie with JWT
        // 2. Redirect back to your frontend
        const requestUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/request`;
        console.log('🔍 DEBUG: Redirecting to OAuth request URL:', requestUrl);
        window.location.href = requestUrl;
    };

    // ✅ Backward compatibility alias
    const login = loginWithGoogle;

    // ✅ Logout: Call backend to clear cookie, then redirect
    const logout = async () => {
        try {
            console.log('🚪 Logging out user...');
            
            // First, try the auth logout endpoint
            let response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/logout`, {
                method: 'POST',
                credentials: 'include', // ✅ Send cookies so backend can clear them
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('⚠️ Auth logout failed, trying OAuth logout as fallback...');
                // Fallback to OAuth logout endpoint
                response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/oauth/logout`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Logged out successfully - cookie cleared by backend:', data.message);
            } else {
                console.warn('⚠️ Both logout endpoints failed, but proceeding with local cleanup');
            }
        } catch (err) {
            console.error('❌ Logout error:', err);
            // Even if logout request fails, clear local state
        } finally {
            // Always clear local state and redirect
            setUser(null);
            setError(null);
            console.log('🔄 Redirecting to login page...');
            window.location.href = '/login';
        }
    };

    // ✅ Refresh user data from backend
    const refreshUser = async () => {
        try {
            console.log('🔄 Refreshing user data...');
            
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/oauth/profile`, {
                method: 'GET',
                credentials: 'include', // ✅ Send cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                console.log('✅ User data refreshed:', userData.email);
                return userData;
            } else {
                throw new Error(`Failed to refresh user data: ${response.status}`);
            }
        } catch (err) {
            console.error('❌ Failed to refresh user:', err);
            
            // If refresh fails due to authentication, logout
            if (err.message.includes('401') || err.message.includes('403')) {
                logout();
            }
            throw err;
        }
    };

    // ✅ Update user profile
    const updateProfile = async (updateData) => {
        try {
            console.log('📝 Updating user profile...');
            
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/oauth/profile`, {
                method: 'PUT',
                credentials: 'include', // ✅ Send cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const result = await response.json();
                setUser(result.user);
                console.log('✅ Profile updated successfully');
                return result;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Profile update failed');
            }
        } catch (err) {
            console.error('❌ Profile update failed:', err);
            throw err;
        }
    };

    // ✅ Delete user account
    const deleteAccount = async () => {
        try {
            console.log('🗑️ Deleting user account...');
            
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/oauth/account`, {
                method: 'DELETE',
                credentials: 'include', // ✅ Send cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log('✅ Account deleted successfully');
                setUser(null);
                setError(null);
                window.location.href = '/login';
                return true;
            } else {
                // Handle potential non-JSON error responses
                const errorText = await response.text();
                let errorMessage = 'Account deletion failed';
                try {
                    // Try to parse it as JSON, but don't fail if it's not
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // If parsing fails, use the raw text if it's not empty
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error('❌ Account deletion failed:', err);
            throw err;
        }
    };

    // ✅ Check authentication when component mounts
    useEffect(() => {
        console.log('🏁 AuthProvider initializing...');
        checkAuth();
    }, []);

    // ✅ All the data and functions we want to share with components
    const value = {
        // State
        user,
        loading,
        error,
        isAuthenticated: !!user,
        
        // Actions
        login,
        loginWithEmail,
        loginWithGoogle,
        registerWithEmail,
        logout,
        checkAuth,
        refreshUser,
        updateProfile,
        deleteAccount,
        
        // Utility functions
        hasRole: (role) => user?.role === role,
        getUserId: () => user?._id,
        getUserEmail: () => user?.email,
        getUserName: () => user?.name
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ✅ Bonus: Higher-order component for protecting routes
export const withAuth = (WrappedComponent) => {
    return function AuthenticatedComponent(props) {
        const { user, loading, login } = useAuth();

        if (loading) {
            return (
                <div id="with-auth-loading-div" style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh' 
                }}>
                    <div id="with-auth-loading-text">Loading...</div>
                </div>
            );
        }

        if (!user) {
            return (
                <div id="with-auth-auth-required-div" style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh' 
                }}>
                    <h2 id="with-auth-auth-required-h2">Authentication Required</h2>
                    <p id="with-auth-auth-required-p">Please log in to access this page.</p>
                    <button onClick={login} id="with-auth-login-button" style={{ 
                        padding: '10px 20px', 
                        fontSize: '16px',
                        cursor: 'pointer' 
                    }}>
                        Login with Google
                    </button>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
};

// ✅ Bonus: Hook for checking specific roles
export const useRequireRole = (requiredRole) => {
    const { user, hasRole } = useAuth();
    
    return {
        hasRequiredRole: hasRole(requiredRole),
        userRole: user?.role,
        isAuthorized: hasRole(requiredRole)
    };
};

export default AuthContext;