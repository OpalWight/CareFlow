import React from 'react';

function LoginPage() {
    function handleGoogleLogin() {
        window.location.href = "http://localhost:3001/request";
    }

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
                <button onClick={handleGoogleLogin}>Sign in with Google</button>
            </div>
        </div>
    );
}

export default LoginPage;