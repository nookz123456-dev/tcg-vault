// Debug: simulate exactly what the admin page does
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
const SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
  // 1. Login exactly like the frontend does
  console.log('=== STEP 1: LOGIN ===');
  const loginRes = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@tcgvault.com', password: 'AdminVault2026!' })
  });
  const loginData = await loginRes.json();
  console.log('Status:', loginRes.status);
  const token = loginData.access_token;
  console.log('Token (first 50):', token?.slice(0, 50));
  console.log('User ID:', loginData.user?.id);
  
  // 2. Test what the admin API does - isUserAdmin check
  console.log('\n=== STEP 2: isUserAdmin CHECK ===');
  
  // 2a. Auth check
  console.log('2a. Auth check with token:');
  const authRes = await fetch(`${URL}/auth/v1/user`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${token}` }
  });
  console.log('  Status:', authRes.status);
  const authData = await authRes.json();
  console.log('  User ID:', authData.id);
  
  // 2b. Profile check
  console.log('2b. Profile check:');
  const profRes = await fetch(`${URL}/rest/v1/profiles?id=eq.${authData.id}&select=role`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  console.log('  Status:', profRes.status);
  const profData = await profRes.json();
  console.log('  Profile:', JSON.stringify(profData));
  console.log('  Is admin?', profData?.[0]?.role === 'admin');
  
  // 3. Test the actual admin API endpoint on Vercel
  console.log('\n=== STEP 3: TEST VERCEL API ===');
  const apiRes = await fetch('https://tcg-vault-sandy.vercel.app/api/admin', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Status:', apiRes.status);
  const apiData = await apiRes.json();
  console.log('Response:', JSON.stringify(apiData).slice(0, 500));
  
  // 4. Also test with ANON key instead of service key for auth check
  console.log('\n=== STEP 4: AUTH CHECK WITH ANON KEY (like frontend) ===');
  const authRes2 = await fetch(`${URL}/auth/v1/user`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
  });
  console.log('Status:', authRes2.status);
  const authData2 = await authRes2.json();
  console.log('User ID:', authData2.id);
}
main().catch(console.error);