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
  // Try login with admin@tcgvault.com
  console.log('=== LOGIN AS admin@tcgvault.com ===');
  const loginRes = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@tcgvault.com', password: 'AdminVault2026!' })
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  
  if (!loginData.access_token) {
    console.log('Login error:', JSON.stringify(loginData));
    
    // Try nookz123456@gmail.com
    console.log('\n=== LOGIN AS nookz123456@gmail.com ===');
    const login2 = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nookz123456@gmail.com', password: 'AdminVault2026!' })
    });
    const login2Data = await login2.json();
    console.log('Login status:', login2.status);
    
    if (!login2Data.access_token) {
      console.log('Login error:', JSON.stringify(login2Data));
      
      // Generate a new admin link using admin API
      console.log('\n=== GENERATE ADMIN LINK ===');
      const linkRes = await fetch(`${URL}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: { 'apikey': SERVICE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'magiclink', email: 'admin@tcgvault.com' })
      });
      const linkData = await linkRes.json();
      console.log('Link status:', linkRes.status);
      if (linkData.hashed_token) {
        console.log('Generated magic link (first 100 chars):', JSON.stringify(linkData).slice(0, 200));
      } else {
        console.log('Link response:', JSON.stringify(linkData).slice(0, 500));
      }
      return;
    }
    
    // Test with this token
    var token = login2Data.access_token;
  } else {
    var token = loginData.access_token;
  }
  
  console.log('Token (first 30):', token.slice(0, 30) + '...');
  
  // Verify auth
  const authRes = await fetch(`${URL}/auth/v1/user`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${token}` }
  });
  const authData = await authRes.json();
  console.log('Auth status:', authRes.status, '| ID:', authData.id, '| Email:', authData.email);
  
  // Check profile
  const profRes = await fetch(`${URL}/rest/v1/profiles?id=eq.${authData.id}&select=role`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  const profData = await profRes.json();
  console.log('Profile:', JSON.stringify(profData));
  console.log('Is Admin:', profData?.[0]?.role === 'admin');
}
main().catch(console.error);