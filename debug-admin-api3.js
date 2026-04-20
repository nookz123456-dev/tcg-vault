const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.+)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});
const URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
  // Login
  const loginRes = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@tcgvault.com', password: 'AdminVault2026!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token;

  // Test admin API with text response
  console.log('=== TEST VERCEL API (with text) ===');
  const apiRes = await fetch('https://tcg-vault-sandy.vercel.app/api/admin', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Status:', apiRes.status);
  console.log('Content-Type:', apiRes.headers.get('content-type'));
  const text = await apiRes.text();
  console.log('Response body (first 1000 chars):', text.slice(0, 1000));
}
main().catch(console.error);