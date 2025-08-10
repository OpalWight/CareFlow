// API Configuration with robust environment detection
console.log('🔍 API CONFIG DIAGNOSTICS:');
console.log('========================');

// Get all possible environment indicators
const viteApiUrl = import.meta.env.VITE_API_URL;
const viteEnv = import.meta.env.VITE_ENV;
const mode = import.meta.env.MODE;
const isProd = import.meta.env.PROD;
const isDev = import.meta.env.DEV;

console.log('Raw environment values:');
console.log('  VITE_API_URL:', viteApiUrl);
console.log('  VITE_ENV:', viteEnv);
console.log('  MODE:', mode);
console.log('  PROD:', isProd);
console.log('  DEV:', isDev);

// Robust API URL determination function
export const getApiUrl = () => {
  console.log('🔍 Analyzing environment for API URL...');
  
  // 1. If VITE_API_URL is a valid HTTP URL, use it
  if (viteApiUrl && viteApiUrl.startsWith('http')) {
    console.log('✅ Using valid VITE_API_URL:', viteApiUrl);
    return viteApiUrl;
  }
  
  // 2. Log why VITE_API_URL was rejected
  if (viteApiUrl) {
    console.log('⚠️ VITE_API_URL rejected (not a valid HTTP URL):', viteApiUrl);
  } else {
    console.log('⚠️ VITE_API_URL is not set or empty');
  }

  // 3. Use domain-based detection (more reliable for deployed apps)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('🌐 Current hostname:', hostname);
    
    if (hostname.includes('vercel.app') || hostname.includes('care-flow')) {
      const prodUrl = 'https://careflow-ssas.onrender.com';
      console.log('✅ Using production URL (domain-based):', prodUrl);
      return prodUrl;
    }
  }

  // 4. Fallback to mode-based logic
  if (mode === 'production' || isProd === true) {
    const prodUrl = 'https://careflow-ssas.onrender.com';
    console.log('✅ Using production URL (mode-based):', prodUrl);
    return prodUrl;
  }

  // 5. Default to development
  const devUrl = 'http://localhost:3001';
  console.log('✅ Using development URL (fallback):', devUrl);
  return devUrl;
};

// 4. Environment-based URL (backup method)
export const getApiUrlByDomain = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const hostname = window.location.hostname;
  
  if (hostname.includes('vercel.app') || 
      hostname.includes('netlify.app') || 
      hostname.includes('onrender.com') ||
      hostname === 'care-flow-ten.vercel.app') {
    return 'https://careflow-ssas.onrender.com';
  }
  
  return 'http://localhost:3001';
};

// Final API URL selection
const primaryApiUrl = getApiUrl();
const fallbackApiUrl = getApiUrlByDomain();

// Use fallback if primary method failed and we're not on localhost
const shouldUseFallback = primaryApiUrl.includes('localhost') && 
                         typeof window !== 'undefined' && 
                         window.location.hostname !== 'localhost';

export const API_URL = shouldUseFallback ? fallbackApiUrl : primaryApiUrl;

console.log('');
console.log('🎯 FINAL API CONFIGURATION:');
console.log('  Primary API URL:', primaryApiUrl);
console.log('  Fallback API URL:', fallbackApiUrl);
console.log('  Selected API URL:', API_URL);
if (typeof window !== 'undefined') {
  console.log('  Current hostname:', window.location.hostname);
}
console.log('========================');

export default API_URL;