import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallbackHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔄 Auth callback handler started');
      
      try {
        // Get the temporary token from URL
        const tempToken = searchParams.get('token');
        const newUser = searchParams.get('newUser');
        const accountLinked = searchParams.get('accountLinked');

        console.log('📦 Received parameters:', { 
          tempToken: tempToken ? 'Present' : 'Missing',
          newUser, 
          accountLinked 
        });

        if (!tempToken) {
          throw new Error('No authentication token received');
        }

        // ✅ HYBRID APPROACH: Exchange temporary token for httpOnly cookie
        console.log('🔄 Exchanging temporary token for secure cookie...');
        const API_URL = import.meta.env.VITE_API_URL || 'https://careflow-ssas.onrender.com';
        
        const response = await fetch(`${API_URL}/oauth/exchange-token`, {
          method: 'POST',
          credentials: 'include', // Important: allows setting cookies
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tempToken })
        });

        console.log('🔍 Token exchange response:', response.status);

        if (response.ok) {
          const data = await response.json();
          setStatus('success');
          
          console.log('✅ Token exchanged for httpOnly cookie, user:', data.user.email);
          console.log('🍪 HttpOnly cookie should now be set for future requests');

          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);

          // Show success message based on type
          let successMessage = 'Login successful!';
          if (newUser === 'true') {
            successMessage = 'Welcome! Your account has been created successfully.';
          } else if (accountLinked === 'true') {
            successMessage = 'Great! Your Google account has been linked.';
          }

          // Redirect to dashboard after short delay
          setTimeout(() => {
            navigate('/dashboard', { 
              state: { successMessage }
            });
          }, 2000);

        } else {
          throw new Error(`Authentication failed: ${response.status}`);
        }

      } catch (error) {
        console.error('❌ Auth callback error:', error);
        setStatus('error');
        
        // Redirect to login after delay
        setTimeout(() => {
          navigate('/login', { 
            state: { error: 'Authentication failed. Please try logging in again.' }
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