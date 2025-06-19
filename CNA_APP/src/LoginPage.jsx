import React from 'react';

function LoginPage() {
    return (
        <div>
            <h1>Login Page</h1>
            <form>
                <input type="text" placeholder="Username" />
                <input type="password" placeholder="Password" />
            </form>
            <div>
                <button>Login</button>
                <button>Sign Up</button>
            </div>
            <div style={{ marginTop: '20px' }}>
                <button style={{ backgroundColor: '#4285F4', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px' }}>
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}

export default LoginPage;