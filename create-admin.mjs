// Admin user creation script
// Creates: admin@tcgvault.com / AdminVault2026!

const SUPABASE_URL = 'https://hezbxloxsgqwbondebjt.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlemJ4bG94c2dxd2JvbmRlYmp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI0MTYwNywiZXhwIjoyMDkxODE3NjA3fQ.xpulrdLMD209QeBgGpC8BLLLNyw5ftvrd9MmyqqKub0'

async function createAdmin() {
  console.log('Creating admin user...')

  // 1. Create auth user
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@tcgvault.com',
      password: 'AdminVault2026!',
      email_confirm: true,
      user_metadata: {
        username: 'Admin',
        display_name: 'Admin',
        role: 'admin',
      },
    }),
  })

  const data = await res.json()
  console.log('Auth user response:', JSON.stringify(data, null, 2))

  if (data.id) {
    // 2. Update profile with admin role
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        role: 'admin',
        username: 'Admin',
        display_name: 'Admin',
        is_public: true,
      }),
    })
    const profileData = await profileRes.json()
    console.log('Profile update:', JSON.stringify(profileData, null, 2))
    console.log('\n✅ Admin created successfully!')
    console.log('   Email: admin@tcgvault.com')
    console.log('   Password: AdminVault2026!')
    console.log('   ID:', data.id)
  } else {
    console.log('❌ Failed to create admin:', data)
  }
}

createAdmin()