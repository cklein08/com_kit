#!/usr/bin/env node

/**
 * Generate runtime config (public/config.js) from .env files.
 * Matches awesomeportal's scripts/generate-runtime-config.cjs.
 * Reads NEXT_PUBLIC_ADOBE_CLIENT_ID or VITE_ADOBE_CLIENT_ID.
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').replace(/^["']|["']$/g, '');
      }
    }
  });
  return envVars;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const envSources = [
  process.env,
  loadEnvFile('.env.local'),
  loadEnvFile(`.env.${nodeEnv}`),
  loadEnvFile('.env'),
];

function getEnvVar(...keys) {
  for (const source of envSources) {
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== '') {
        return source[key];
      }
    }
  }
  return '';
}

const adobeClientId = getEnvVar('NEXT_PUBLIC_ADOBE_CLIENT_ID', 'VITE_ADOBE_CLIENT_ID');

const configContent = `// Runtime config from .env (awesomeportal-style)
// Generated: ${new Date().toISOString()}
(function(){if(typeof window==='undefined')return;window.APP_CONFIG=window.APP_CONFIG||{};window.APP_CONFIG.ADOBE_CLIENT_ID=window.APP_CONFIG.ADOBE_CLIENT_ID||'${(adobeClientId || '').replace(/'/g, "\\'")}';})();
`;

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
const configPath = path.join(publicDir, 'config.js');
fs.writeFileSync(configPath, configContent);

console.log('✅ Generated public/config.js');
if (adobeClientId) {
  console.log('   ADOBE_CLIENT_ID:', adobeClientId.slice(0, 12) + '...');
} else {
  console.log('   ADOBE_CLIENT_ID: (not set – add NEXT_PUBLIC_ADOBE_CLIENT_ID to .env)');
}
