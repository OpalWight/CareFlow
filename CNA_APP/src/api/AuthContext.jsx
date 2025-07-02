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
            
            const response = await fetch('http://localhost:3001/oauth/verify', {
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

    // ✅ Login: Redirect to Google OAuth (backend handles cookie setting)
    const login = () => {
        console.log('🚀 Initiating Google OAuth login...');
        // Redirect to your backend OAuth endpoint
        // After successful OAuth, backend will:
        // 1. Set HTTP-only cookie with JWT
        // 2. Redirect back to your frontend
        window.location.href = 'http://localhost:3001/request';
    };

    // ✅ Logout: Call backend to clear cookie, then redirect
    const logout = async () => {
        try {
            console.log('🚪 Logging out user...');
            
            const response = await fetch('http://localhost:3001/oauth/logout', {
                method: 'POST',
                credentials: 'include', // ✅ Send cookies so backend can clear them
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setUser(null);
                setError(null);
                console.log('✅ Logged out successfully - cookie cleared by backend');
            } else {
                console.warn('⚠️ Logout request failed, but proceeding with local cleanup');
            }
        } catch (err) {
            console.error('❌ Logout error:', err);
            // Even if logout request fails, clear local state
        } finally {
            // Always clear local state and redirect
            setUser(null);
            setError(null);
            window.location.href = '/login';
        }
    };

    // ✅ Refresh user data from backend
    const refreshUser = async () => {
        try {
            console.log('🔄 Refreshing user data...');
            
            const response = await fetch('http://localhost:3001/oauth/profile', {
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
            
            const response = await fetch('http://localhost:3001/oauth/profile', {
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
            
            const response = await fetch('http://localhost:3001/oauth/account', {
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
                const errorData = await response.json();
                throw new Error(errorData.error || 'Account deletion failed');
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
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh' 
                }}>
                    <div>Loading...</div>
                </div>
            );
        }

        if (!user) {
            return (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh' 
                }}>
                    <h2>Authentication Required</h2>
                    <p>Please log in to access this page.</p>
                    <button onClick={login} style={{ 
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