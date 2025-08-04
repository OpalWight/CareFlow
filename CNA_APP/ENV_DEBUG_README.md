# Environment Variable Debugging Guide

## 🔍 Diagnosing Environment Variable Issues

This project now includes comprehensive debugging tools to identify why production environment variables aren't being loaded correctly.

## 🛠️ Debugging Tools Added

### 1. Build-Time Logging (`scripts/log-env.js`)
- Logs all environment variables available during build
- Run automatically before each build
- Shows if VITE_ variables are properly loaded

### 2. Runtime Environment Detection (`main.jsx`)
- Console logs show what environment variables were embedded in the built app
- Appears in browser console when the app loads
- Helps identify if the issue is build-time or runtime

### 3. Visual Debug Component (`EnvDebugComponent.jsx`)
- Red button in top-right corner labeled "🔍 ENV DEBUG"
- Click to see current environment variables
- API URL shown in red if using localhost, green if production
- Includes API connection test button

### 4. Enhanced Vite Config (`vite.config.js`)
- Explicit environment variable loading with diagnostics
- Logs during build process
- Additional defined variables for debugging

## 📝 Build Scripts Available

```bash
# Standard build (with debugging)
npm run build

# Test production build locally
npm run build:test-prod

# Preview production build
npm run preview:prod

# Debug build with explicit NODE_ENV
npm run build:debug
```

## 🕵️ Debugging Process

### Step 1: Check Build Logs
Run `npm run build` and look for:
```
🔍 BUILD-TIME ENVIRONMENT DIAGNOSTICS
=====================================
📅 Build Time: 2024-01-XX...
🌍 NODE_ENV: production
🔧 VITE ENVIRONMENT VARIABLES:
VITE_API_URL: https://careflow-ssas.onrender.com
```

### Step 2: Check Runtime Logs
After deployment, open browser console and look for:
```
🔍 FRONTEND RUNTIME ENVIRONMENT DIAGNOSTICS
==========================================
🌍 MODE: production
VITE_API_URL: https://careflow-ssas.onrender.com
```

### Step 3: Use Visual Debug Component
- Click the red "🔍 ENV DEBUG" button in top-right
- Check if API URL is red (localhost) or green (production)
- Use "Test API Connection" button to verify connectivity

## 🚨 Common Issues & Solutions

### Issue: Build logs show localhost URLs
**Solution**: Environment variables aren't set during build
- For Vercel: Set environment variables in Vercel dashboard
- For Netlify: Set in site settings > Environment variables
- For Render: Set in service settings > Environment tab

### Issue: Runtime logs show localhost URLs
**Solution**: Build was done with development environment
- Ensure build command uses `--mode production`
- Verify NODE_ENV=production during build
- Check deployment platform build command

### Issue: Environment variables set but still showing localhost
**Possible causes**:
1. Build cache not cleared
2. Environment variables not available during build step
3. Wrong build command being used
4. .env.production not being loaded

## 🎯 Expected Results

### ✅ Correct Production Build
- Build logs show production URLs
- Runtime logs show production URLs
- Debug component shows green API URL
- API connection test succeeds

### ❌ Incorrect Build
- Build logs show localhost URLs
- Runtime logs show localhost URLs  
- Debug component shows red API URL
- API connection test fails or connects to localhost

## 🔧 Deployment Platform Specific

### Vercel
```bash
# Build Command
npm run build

# Environment Variables
VITE_API_URL=https://careflow-ssas.onrender.com
VITE_ENV=production
```

### Netlify
```bash
# Build Command  
npm run build

# Environment Variables
VITE_API_URL=https://careflow-ssas.onrender.com
VITE_ENV=production
```

### Render
```bash
# Build Command
npm run build

# Environment Variables
VITE_API_URL=https://careflow-ssas.onrender.com
VITE_ENV=production
```

## 🧹 Cleanup

After debugging is complete, you can remove:
- `EnvDebugComponent` import and usage in `App.jsx`
- Console logs in `main.jsx`
- Build-time logging script if desired
- This README file

The enhanced `vite.config.js` and debugging scripts can be kept for future debugging needs.