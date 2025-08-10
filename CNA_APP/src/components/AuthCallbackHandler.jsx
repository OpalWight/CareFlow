import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallbackHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔄 Auth callback handler started');
      console.log('🔍 Current URL:', window.location.href);
      console.log('🔍 Current pathname:', window.location.pathname);
      
      try {
        // Get the temporary token from URL
        const tempToken = searchParams.get('token');
        const newUser = searchParams.get('newUser');
        const accountLinked = searchParams.get('accountLinked');

        console.log('📦 Received parameters:', { 
          tempToken: tempToken ? `Present (${tempToken.substring(0, 20)}...)` : 'Missing',
          newUser, 
          accountLinked 
        });

        if (!tempToken) {
          throw new Error('No authentication token received');
        }

        // ✅ HYBRID APPROACH: Exchange temporary token for httpOnly cookie
        console.log('🔄 Starting token exchange...');
        const API_URL = import.meta.env.VITE_API_URL || 'https://careflow-ssas.onrender.com';
        console.log('🔍 Using API URL:', API_URL);
        
        const requestTime = Date.now();
        const response = await fetch(`${API_URL}/oauth/exchange-token`, {
          method: 'POST',
          credentials: 'include', // Important: allows setting cookies
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tempToken })
        });
        
        const responseTime = Date.now() - requestTime;
        console.log('🔍 Token exchange response:', response.status, `(took ${responseTime}ms)`);
        
        // Check for cookies after response
        console.log('🍪 Cookies after token exchange:');
        console.log('🍪 document.cookie:', document.cookie);
        console.log('🍪 Response headers:', [...response.headers.entries()]);
        
        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) {
          console.log('🍪 Set-Cookie header from response:', setCookieHeader);
        } else {
          console.log('⚠️ No Set-Cookie header in response');
        }

        if (response.ok) {
          const data = await response.json();
          setStatus('success');
          
          console.log('✅ Token exchanged successfully!');
          console.log('📊 User data received:', {
            email: data.user?.email,
            name: data.user?.name,
            id: data.user?._id,
            authMethod: data.user?.authMethod
          });

          // Clean up URL
          console.log('🧹 Cleaning up URL parameters...');
          window.history.replaceState({}, document.title, window.location.pathname);

          // Show success message based on type
          let successMessage = 'Login successful!';
          if (newUser === 'true') {
            successMessage = 'Welcome! Your account has been created successfully.';
          } else if (accountLinked === 'true') {
            successMessage = 'Great! Your Google account has been linked.';
          }

          console.log('💬 Success message:', successMessage);

          // Navigate immediately with user data in state (secure)
          const navigationState = { 
            successMessage,
            user: data.user, // Pass user data securely via navigation state
            fromOAuth: true
          };
          
          console.log('🚀 Navigating to dashboard with secure state...');
          console.log('📦 Navigation state keys:', Object.keys(navigationState));
          
          navigate('/dashboard', { state: navigationState });

        } else {
          console.error('❌ Token exchange failed with status:', response.status);
          const errorText = await response.text();
          console.error('❌ Error response body:', errorText);
          throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
        }

      } catch (error) {
        console.error('❌ Auth callback error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        setStatus('error');
        
        // Redirect to login after delay
        console.log('🔄 Redirecting to login in 3 seconds...');
        setTimeout(() => {
          navigate('/login', { 
            state: { error: `Authentication failed: ${error.message}` }
          });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  const renderStatus = () => {
    switch (status) {
      case 'processing':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              animation: 'spin 2s linear infinite' 
            }}>
              ⚡
            </div>
            <h2>Completing authentication...</h2>
            <p>Please wait while we log you in.</p>
          </div>
        );
        
      case 'success':
        return (
          <div style={{ textAlign: 'center', color: 'green' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
            <h2>Authentication successful!</h2>
            <p>Redirecting you to the dashboard...</p>
          </div>
        );
        
      case 'error':
        return (
          <div style={{ textAlign: 'center', color: 'red' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <h2>Authentication failed</h2>
            <p>Redirecting you back to login...</p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {renderStatus()}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallbackHandler;