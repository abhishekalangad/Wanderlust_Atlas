const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/environments/environment.prod.ts');
const targetDevPath = path.join(__dirname, '../src/environments/environment.ts');

const supabaseUrl = process.env.SUPABASE_URL || 'https://YOUR_SUPABASE_PROJECT_ID.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_PUBLISHABLE_KEY';

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

console.log('Environment configuration generated from environment variables.');
