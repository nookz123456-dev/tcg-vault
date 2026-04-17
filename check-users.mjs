const URL = 'https://hezbxloxsgqwbondebjt.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlemJ4bG94c2dxd2JvbmRlYmp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI0MTYwNywiZXhwIjoyMDkxODE3NjA3fQ.xpulrdLMD209QeBgGpC8BLLLNyw5ftvrd9MmyqqKub0'

async function check() {
  // Get all auth users
  const authRes = await fetch(`${URL}/auth/v1/admin/users?per_page=100`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  })
  const authData = await authRes.json()
  const users = authData.users || authData
  console.log('=== Auth Users ===')
  users.forEach(u => {
    console.log(`${u.email} | ${u.user_metadata?.username || '-'} | ${u.created_at?.slice(0,10)} | ${u.id.slice(0,8)}...`)
  })
  console.log(`Total: ${users.length} users`)

  // Get profiles
  const profRes = await fetch(`${URL}/rest/v1/profiles?select=*&order=created_at.desc`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  })
  const profiles = await profRes.json()
  console.log('\n=== Profiles ===')
  profiles.forEach(p => {
    console.log(`${p.username || '-'} | role: ${p.role} | ${p.id.slice(0,8)}... | ${p.created_at?.slice(0,10)}`)
  })
  console.log(`Total: ${profiles.length} profiles`)
}

check()