import { createClient } from '@supabase/supabase-js'

// Test REST API directly with publishable key
async function testRest() {
  const url = 'https://hezbxloxsgqwbondebjt.supabase.co'
  const key = 'sb_publishable_Y4STzv-8E-iXcivRYswjgQ_H1rFRXdI'
  
  console.log('Testing REST API with publishable key...')
  const res = await fetch(`${url}/rest/v1/profiles?select=id,username&limit=1`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    }
  })
  const data = await res.json()
  console.log('REST result:', res.status, JSON.stringify(data))
  
  // Test signup with publishable key
  console.log('\nTesting signup endpoint...')
  const signupRes = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: 'test123@example.com', password: 'test123456' })
  })
  const signupData = await signupRes.json()
  console.log('Signup result:', signupRes.status, JSON.stringify(signupData))
}

testRest().catch(console.error)