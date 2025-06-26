import React, { useState } from 'react';
import { useAuth } from './api/AuthContext';

function Dashboard() {
    const { user, loading, logout } = useAuth();
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: user?.name || '' });
    const [error, setError] = useState(null);

    // Populate edit form when editing starts
    const handleEditToggle = () => {
        if (!editing && user) {
            setEditForm({ name: user.name || '' });
        }
        setEditing(!editing);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/oauth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(editForm)
            });
            if (response.ok) {
                // Optionally, you could update the user in AuthContext here
                setEditing(false);
                alert('Profile updated successfully!');
            } else {
                const errorText = await response.text();
                throw new Error(`Update failed: ${errorText}`);
            }
        } catch (error) {
            setError(error.message);
            alert(`Failed to update profile: ${error.message}`);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }
        try {
            const response = await fetch('http://localhost:3001/oauth/account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            if (response.ok) {
                logout();
                alert('Account deleted successfully');
                window.location.href = '/login';
            } else {
                const errorText = await response.text();
                throw new Error(`Deletion failed: ${errorText}`);
            }
        } catch (error) {
            setError(error.message);
            alert(`Failed to delete account: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div>Loading...</div>
                <div style={{ fontSize: '0.9em', color: '#666', marginTop: '1rem' }}>
                    Verifying authentication...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
                <div>Error: {error}</div>
                <div style={{ fontSize: '0.9em', marginTop: '1rem' }}>
                    Redirecting to login page...
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div>No user data available</div>
                <button onClick={logout} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Dashboard</h1>
            <div style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Profile Information</h2>
                    <button onClick={handleEditToggle} style={{ padding: '0.5rem 1rem', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        {editing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                    {user.picture && (
                        <img src={user.picture} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #ddd' }} />
                    )}
                    <div style={{ flex: 1 }}>
                        {editing ? (
                            <form onSubmit={handleUpdateProfile}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label>Name:</label>
                                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }} required />
                                </div>
                                <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}>
                                    Save Changes
                                </button>
                            </form>
                        ) : (
                            <div>
                                <p><strong>Name:</strong> {user.name}</p>
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>User ID:</strong> {user._id}</p>
                                <p><strong>Auth Method:</strong> {user.authMethod}</p>
                                <p><strong>Role:</strong> {user.role}</p>
                                <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                                <p><strong>Last Login:</strong> {new Date(user.lastLogin).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={logout} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Logout
                </button>
                <button onClick={handleDeleteAccount} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Delete Account
                </button>
            </div>
        </div>
    );
}

export default Dashboard;