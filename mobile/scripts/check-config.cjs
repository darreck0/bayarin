const fs = require('node:fs');
if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Both EXPO_PUBLIC_SUPABASE variables are required for an installable build.');
if (new URL(url).protocol !== 'https:') throw new Error('Use your HTTPS Supabase project URL.');
let anonymousKey = false;
if (key.startsWith('eyJ')) {
  try { anonymousKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; } catch {}
}
if (!key.startsWith('sb_publishable_') && !anonymousKey) throw new Error('Only a publishable key or legacy anon key may be bundled. Never use a secret/service-role key.');
console.log('Supabase public configuration verified. No values displayed.');
