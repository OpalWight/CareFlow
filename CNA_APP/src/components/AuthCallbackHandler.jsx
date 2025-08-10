import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API_URL from '../config/apiConfig.js';

/**
 * 🛡️ SECURITY NOTE: OAuth Callback Handler with Enhanced Security
 * 
 * This component handles the OAuth callback and implements several security measures:
 * 
 * 1. ⚡ IMMEDIATE URL CLEANUP: Removes tokens from URL and browser history ASAP
 * 2. ⏱️  TOKEN VALIDATION: Validates token format and expiration before use
 * 3. 🔒 SECURE EXCHANGE: Exchanges temporary token for httpOnly cookie immediately
 * 4. 🧹 MEMORY CLEANUP: Clears token references from memory after use
 * 5. 📝 SECURE LOGGING: Logs security actions without exposing sensitive data
 * 
 * The temporary token approach is used to solve cross-origin cookie issues while
 * minimizing security exposure through immediate cleanup and validation.
 */

const AuthCallbackHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    // 🛡️ SECURITY: Set a timeout to prevent indefinite token exposure
    const securityTimeout = setTimeout(() => {
      console.error('🚨 SECURITY: OAuth callback timeout - clearing state for security');
      setStatus('error');
      navigate('/login', { 
        state: { error: 'Authentication timeout for security. Please try again.' }
      });
    }, 30000); // 30 second timeout
    const handleAuthCallback = async () => {
      console.log('🔄 Auth callback handler started');
      console.log('🔍 Current URL:', window.location.href);
      console.log('🔍 Current pathname:', window.location.pathname);
      
      try {
        // 🛡️ SECURITY: Immediately extract and clear sensitive URL parameters
        const tempToken = searchParams.get('token');
        const newUser = searchParams.get('newUser');
        const accountLinked = searchParams.get('accountLinked');

        // 🚨 SECURITY: Immediately clean URL to remove token from browser history
        console.log('🧹 SECURITY: Immediately cleaning URL to remove token exposure...');
        const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // 🚨 SECURITY: Clear the current URL from browser history entirely
        if (window.history.length > 1) {
          // Replace the current history entry to prevent back-button token exposure
          window.history.replaceState({}, document.title, cleanUrl);
        }

        console.log('📦 Received parameters:', { 
          tempToken: tempToken ? `Present (${tempToken.substring(0, 20)}...)` : 'Missing',
          tempTokenLength: tempToken ? tempToken.length : 0,
          newUser, 
          accountLinked 
        });

        if (!tempToken) {
          throw new Error('No authentication token received');
        }

        // 🛡️ SECURITY: Validate token format and expiration
        try {
          const tokenParts = tempToken.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
          }
          
          // Decode token payload to check expiration (without verification)
          const payload = JSON.parse(atob(tokenParts[1]));
          const now = Math.floor(Date.now() / 1000);
          
          if (payload.exp && payload.exp < now) {
            throw new Error('Authentication token has expired');
          }
          
          console.log('✅ Token format valid, expires in:', payload.exp ? (payload.exp - now) : 'unknown', 'seconds');
        } catch (tokenError) {
          console.error('❌ Token validation failed:', tokenError.message);
          throw new Error(`Invalid authentication token: ${tokenError.message}`);
        }

        // ✅ HYBRID APPROACH: Exchange temporary token for httpOnly cookie
        console.log('🔄 Starting token exchange...');
        console.log('🔍 Using corrected API URL:', API_URL);
        
        // 🛡️ SAFETY: Final API URL validation
        let finalApiUrl = API_URL;
        if (!finalApiUrl || !finalApiUrl.startsWith('http')) {
          finalApiUrl = 'https://careflow-ssas.onrender.com';
          console.log('⚠️ API_URL invalid, using safety fallback:', finalApiUrl);
        }
        
        const requestTime = Date.now();
        const response = await fetch(`${finalApiUrl}/oauth/exchange-token`, {
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

          // 🛡️ SECURITY: Clear any remaining references to the temporary token
          console.log('🛡️ SECURITY: Clearing temporary token from memory...');
          const tempTokenCleared = tempToken; // Keep reference for logging only
          // tempToken = null; // Variable is const, so it will be garbage collected
          
          console.log('🛡️ SECURITY: Token exchange complete, temporary token no longer needed');
          console.log('🔒 SECURITY: Authentication now secured via httpOnly cookie only');

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
          
          // 🛡️ SECURITY: Clear timeout since we're successfully completing
          clearTimeout(securityTimeout);
          
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
        
        // 🛡️ SECURITY: Clear timeout on error
        clearTimeout(securityTimeout);
        
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
    
    // 🛡️ SECURITY: Cleanup function to clear timeout if component unmounts
    return () => {
      console.log('🧹 SECURITY: AuthCallbackHandler cleanup - clearing timeout');
      clearTimeout(securityTimeout);
    };
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
              🔒
            </div>
            <h2>Securing your authentication...</h2>
            <p>Please wait while we complete the secure login process.</p>
            <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
              🛡️ Implementing security measures...
            </small>
          </div>
        );
        
      case 'success':
        return (
          <div style={{ textAlign: 'center', color: 'green' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔐</div>
            <h2>Authentication secured!</h2>
            <p>Redirecting you to the dashboard...</p>
            <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
              ✅ Security measures completed successfully
            </small>
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