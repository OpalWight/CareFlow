import React, { useState } from 'react';
import API_URL from '../config/apiConfig.js';

const EnvDebugComponent = () => {
  const [isVisible, setIsVisible] = useState(false);

  const envData = {
    'Build-time Variables': {
      'MODE': import.meta.env.MODE,
      'PROD': import.meta.env.PROD,
      'DEV': import.meta.env.DEV,
      'VITE_API_URL (raw)': import.meta.env.VITE_API_URL,
      'VITE_ENV': import.meta.env.VITE_ENV
    },
    'API Configuration': {
      'Computed API URL': API_URL,
      'Is Production URL': API_URL.includes('careflow-ssas.onrender.com'),
      'Is Localhost': API_URL.includes('localhost')
    },
    'Runtime Info': {
      'Current Time': new Date().toISOString(),
      'User Agent': navigator.userAgent,
      'Location': window.location.href,
      'Hostname': window.location.hostname
    },
    'Full import.meta.env': import.meta.env
  };

  const getApiUrl = () => {
    return API_URL;
  };

  const testApiConnection = async () => {
    const apiUrl = getApiUrl();
    try {
      const response = await fetch(`${apiUrl}/`, { 
        method: 'GET',
        credentials: 'include'
      });
      console.log('🔍 API Test Response:', response.status, response.ok);
      const data = await response.json();
      console.log('🔍 API Test Data:', data);
      return { success: true, status: response.status, data };
    } catch (error) {
      console.error('🔍 API Test Error:', error);
      return { success: false, error: error.message };
    }
  };

  const testCookieEndpoint = async () => {
    const apiUrl = getApiUrl();
    try {
      console.log('🍪 Testing cookie endpoint...');
      const response = await fetch(`${apiUrl}/test-cookie`, { 
        method: 'GET',
        credentials: 'include'
      });
      console.log('🍪 Cookie Test Response:', response.status, response.ok);
      const data = await response.json();
      console.log('🍪 Cookie Test Data:', data);
      return { success: true, status: response.status, data };
    } catch (error) {
      console.error('🍪 Cookie Test Error:', error);
      return { success: false, error: error.message };
    }
  };

  if (!isVisible) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        backgroundColor: '#ff6b6b',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: 'monospace'
      }} onClick={() => setIsVisible(true)}>
        🔍 ENV DEBUG
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      backgroundColor: '#1a1a1a',
      color: '#00ff00',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'Courier New, monospace',
      zIndex: 9999,
      overflow: 'auto',
      border: '2px solid #00ff00'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#ff6b6b' }}>🔍 Environment Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            padding: '2px 6px',
            cursor: 'pointer',
            borderRadius: '3px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong style={{ color: '#ffff00' }}>Current API URL:</strong>
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '5px', 
          margin: '5px 0',
          borderRadius: '3px',
          color: API_URL.includes('localhost') ? '#ff6b6b' : '#00ff00'
        }}>
          {getApiUrl()}
        </div>
        <button 
          onClick={testApiConnection}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            cursor: 'pointer',
            borderRadius: '3px',
            fontSize: '10px',
            marginRight: '5px'
          }}
        >
          Test API Connection
        </button>
        <button 
          onClick={testCookieEndpoint}
          style={{
            background: '#FF9800',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            cursor: 'pointer',
            borderRadius: '3px',
            fontSize: '10px'
          }}
        >
          Test Cookie Endpoint
        </button>
      </div>

      {Object.entries(envData).map(([category, data]) => (
        <div key={category} style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#ffff00' }}>{category}:</strong>
          <div style={{ marginLeft: '10px' }}>
            {typeof data === 'object' ? (
              Object.entries(data).map(([key, value]) => (
                <div key={key} style={{ margin: '3px 0' }}>
                  <span style={{ color: '#87ceeb' }}>{key}:</span>{' '}
                  <span style={{ 
                    color: (key.includes('API_URL') && typeof value === 'string' && value.includes('localhost')) ? '#ff6b6b' : '#ffffff'
                  }}>
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </span>
                </div>
              ))
            ) : (
              <span style={{ color: '#ffffff' }}>{String(data)}</span>
            )}
          </div>
        </div>
      ))}

      <div style={{ marginTop: '10px', padding: '5px', backgroundColor: '#2a2a2a', borderRadius: '3px' }}>
        <strong style={{ color: '#ffff00' }}>Instructions:</strong>
        <div style={{ color: '#cccccc', fontSize: '10px' }}>
          • Red API URL = Using localhost (development)
          • Green API URL = Using production URL
          • Check browser console for more detailed logs
          • This component helps diagnose environment variable issues
        </div>
      </div>
    </div>
  );
};

export default EnvDebugComponent;