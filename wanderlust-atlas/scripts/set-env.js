const fs = require('fs');
const path = require('path');

// Try reading local .env if available
const envPath = path.join(__dirname, '../.env');
let fileEnv = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      fileEnv[key] = val;
    }
  });
}

const targetPath = path.join(__dirname, '../src/environments/environment.prod.ts');
const targetDevPath = path.join(__dirname, '../src/environments/environment.ts');

const defaultUrl = 'https://lbaidwarzykhplbtvilu.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiYWlkd2FyenlraHBsYnR2aWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTkxNjIsImV4cCI6MjEwMzU3NTE2Mn0.DLabzHKTOpze6u9EDd65kURzLEoAMDfDDvi8gaSWfS4';

const rawUrl = process.env.SUPABASE_URL || fileEnv['SUPABASE_URL'] || defaultUrl;
const rawKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || fileEnv['SUPABASE_KEY'] || fileEnv['SUPABASE_ANON_KEY'] || defaultKey;

const supabaseUrl = rawUrl.trim();
const supabaseKey = rawKey.trim();

const envConfigFile = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}',
};
`;

const envDevConfigFile = `export const environment = {
  production: false,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}',
};
`;

fs.writeFileSync(targetPath, envConfigFile);
fs.writeFileSync(targetDevPath, envDevConfigFile);

console.log('Environment configuration loaded successfully for local and cloud builds.');
