import React, { useState, useEffect } from 'react';
import { useAuth } from '../api/AuthContext'; // ← Import useAuth hook
import '../styles/Dashboard.css';
import Layout from '../components/Layout';
import ProgressDashboard from '../components/ProgressDashboard';

function Dashboard() {
    const {
        user,
        loading,
        logout,
        updateProfile,
        deleteAccount, // ✅ ADDED: Destructure deleteAccount function
        isAuthenticated
    } = useAuth(); // ← Get authentication data

    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '' });
    const [successMessage, setSuccessMessage] = useState(null); // ✅ ADDED: Success messages
    const [error, setError] = useState(null); // ✅ ADDED: Error handling

    // ✅ ADDED: Handle OAuth success messages and initialize edit form
    useEffect(() => {
        // Handle OAuth success messages from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const newUser = urlParams.get('newUser');
        const accountLinked = urlParams.get('accountLinked');

        if (newUser === 'true') {
            setSuccessMessage('Welcome! Your Google account has been registered successfully.');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (accountLinked === 'true') {
            setSuccessMessage('Great! Your Google account has been linked to your existing account.');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Initialize edit form when user data is available
        if (user) {
            setEditForm({ name: user.name || '' });
        }
    }, [user]); // ✅ CHANGED: Depend on user data

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError(null); // ✅ ADDED: Clear previous errors
        
        try {
            await updateProfile(editForm); // ← Use the updateProfile function
            setEditing(false);
            setSuccessMessage('Profile updated successfully!'); // ✅ CHANGED: Use state instead of alert
        } catch (error) {
            console.error('Profile update error:', error);
            setError(`Failed to update profile: ${error.message}`); // ✅ CHANGED: Use state instead of alert
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }
        
        setError(null); // ✅ ADDED: Clear previous errors
        
        try {
            await deleteAccount(); // ✅ FIXED: Now properly destructured from useAuth
            // User will be redirected automatically by deleteAccount function
        } catch (error) {
            console.error('Account deletion error:', error);
            setError(`Failed to delete account: ${error.message}`); // ✅ CHANGED: Use state instead of alert
        }
    };

    // ✅ ADDED: Function to clear success messages
    const clearSuccessMessage = () => {
        setSuccessMessage(null);
    };

    // ✅ ADDED: Function to clear error messages
    const clearError = () => {
        setError(null);
    };

    // Show loading state
    if (loading) {
        return (
            <div className="dashboard-loading">
                <div id="dashboard-loading-div">Loading...</div>
                <div className="dashboard-loading-subtext">
                    Verifying authentication...
                </div>
            </div>
        );
    }

    // Show login prompt if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="dashboard-no-user">
                <div id="dashboard-no-user-div">Please log in to access this page</div>
                <button onClick={() => window.location.href = '/login'}>
                    Go to Login
                </button>
            </div>
        );
    }

    // Show dashboard for authenticated users
    return (
        <Layout className="dashboard-container">
            {/* ✅ ADDED: Success message display */}
            {successMessage && (
                <div className="dashboard-success-message">
                    <strong id="dashboard-success-strong">Success!</strong> {successMessage}
                    <button 
                        onClick={clearSuccessMessage}
                        className="dashboard-dismiss-success"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* ✅ ADDED: Error message display */}
            {error && (
                <div className="dashboard-error-message">
                    <strong id="dashboard-error-strong">Error:</strong> {error}
                    <button 
                        onClick={clearError}
                        className="dashboard-dismiss-error"
                    >
                        ✕
                    </button>
                </div>
            )}

            <h1 className='dashboard-welcome'>Welcome, {user.name}!</h1>
           
            {/* Profile information */}
            <div className='dashboard-profile-box'>
            <div className="dashboard-profile-card">
                <div className="dashboard-profile-header">
                    <h2 id="dashboard-profile-h2">Profile Information</h2>
                    <button 
                        onClick={() => setEditing(!editing)} 
                        className="dashboard-edit-btn"
                    >
                        {editing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
                
                <div className="dashboard-profile-details">
                    {/* ✅ ADDED: Profile picture display */}
                    {user.picture && (
                        <img 
                            src={user.picture} 
                            alt="Profile" 
                            className="dashboard-profile-img" 
                        />
                    )}
                    
                    {editing ? (
                        <form onSubmit={handleUpdateProfile} className="dashboard-edit-form">
                            <div className="dashboard-form-group">
                                <label id="dashboard-name-label">Name:</label>
                                <input
                                    id="dashboard-name-input"
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="dashboard-input"
                                    required
                                />
                            </div>
                            <div className="dashboard-form-actions">
                                <button type="submit" className="dashboard-save-btn">
                                    Save Changes
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setEditing(false);
                                        setEditForm({ name: user.name || '' }); // Reset form
                                    }}
                                    className="dashboard-cancel-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="dashboard-user-info">
                            <p><strong id="dashboard-name-strong">Name:</strong> {user.name}</p>
                            <p><strong id="dashboard-email-strong">Email:</strong> {user.email}</p>
                            <p><strong id="dashboard-user-id-strong">User ID:</strong> {user._id || user.userId}</p>
                            <p><strong id="dashboard-auth-method-strong">Auth Method:</strong> {user.authMethod}</p>
                            <p><strong id="dashboard-role-strong">Role:</strong> {user.role}</p>
                            {/* ✅ ADDED: Additional user info */}
                            {user.createdAt && (
                                <p><strong id="dashboard-member-since-strong">Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                            )}
                            {user.lastLogin && (
                                <p><strong id="dashboard-last-login-strong">Last Login:</strong> {new Date(user.lastLogin).toLocaleString()}</p>
                            )}
                        </div>
                    )}
                </div>
                {/* Action buttons */}
            
            </div>
            <div className="dashboard-actions">
                <button onClick={logout} className="dashboard-logout-btn">
                    Logout
                </button>
                <button onClick={handleDeleteAccount} className="dashboard-delete-btn">
                    Delete Account
                </button>
            </div>
            </div>

            {/* Progress Dashboard Section */}
            <div className="dashboard-progress-section">
                <ProgressDashboard />
            </div>
            
        </Layout>
    );
}

export default Dashboard;