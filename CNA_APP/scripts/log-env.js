#!/usr/bin/env node

// Build-time environment variable logging script
console.log('🔍 BUILD-TIME ENVIRONMENT DIAGNOSTICS');
console.log('=====================================');
console.log('📅 Build Time:', new Date().toISOString());
console.log('🏗️ Node Version:', process.version);
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('');

console.log('🔧 VITE ENVIRONMENT VARIABLES:');
console.log('------------------------------');
const viteVars = Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .sort();

if (viteVars.length === 0) {
  console.log('❌ No VITE_ environment variables found!');
} else {
  viteVars.forEach(key => {
    console.log(`${key}:`, process.env[key]);
  });
}

console.log('');
console.log('🌐 ALL ENVIRONMENT VARIABLES:');
console.log('-----------------------------');
const allVars = Object.keys(process.env).sort();
allVars.forEach(key => {
  const value = process.env[key];
  // Don't log sensitive values, just show if they exist
  if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
    console.log(`${key}:`, value ? '[SET]' : '[UNSET]');
  } else {
    console.log(`${key}:`, value);
  }
});

console.log('');
console.log('📁 WORKING DIRECTORY:', process.cwd());
console.log('=====================================');