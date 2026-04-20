// Debug: test admin API with real token
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
  // 1. Login as nook@tcgvault.com
  console.log('=== LOGIN AS nook@tcgvault.com ===');
  const loginRes = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nook@tcgvault.com', password: 'AdminVault2026!' })
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  if (loginData.access_token) {
    console.log('Token (first 30 chars):', loginData.access_token.slice(0, 30) + '...');
    console.log('User ID:', loginData.user?.id);
    console.log('Email:', loginData.user?.email);
  } else {
    console.log('Login error:', JSON.stringify(loginData));
    return;
  }

  const token = loginData.access_token;

  // 2. Test auth/v1/user with this token
  console.log('\n=== TEST AUTH ===');
  const authRes = await fetch(`${URL}/auth/v1/user`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${token}` }
  });
  console.log('Auth status:', authRes.status);
  const authData = await authRes.json();
  console.log('Auth user ID:', authData.id);
  console.log('Auth email:', authData.email);

  // 3. Test profile lookup
  console.log('\n=== TEST PROFILE LOOKUP ===');
  const profileRes = await fetch(`${URL}/rest/v1/profiles?id=eq.${authData.id}&select=role`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  console.log('Profile status:', profileRes.status);
  const profileData = await profileRes.json();
  console.log('Profile:', JSON.stringify(profileData));

  // 4. Test admin API endpoint
  console.log('\n=== TEST ADMIN API ===');
  const adminRes = await fetch(`https://tcg-vault-sandy.vercel.app/api/admin`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Admin API status:', adminRes.status);
  const adminData = await adminRes.json();
  console.log('Admin API response:', JSON.stringify(adminData).slice(0, 300));
}
main().catch(console.error);