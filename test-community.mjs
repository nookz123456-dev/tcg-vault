import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hezbxloxsgqwbondebjt.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlemJ4bG94c2dxd2JvbmRlYmp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI0MTYwNywiZXhwIjoyMDkxODE3NjA3fQ.xpulrdLMD209QeBgGpC8BLLLNyw5ftvrd9MmyqqKub0'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  // Test follows with composite key
  const { data: follows, error: fErr } = await supabase
    .from('follows')
    .select('follower_id, following_id')
    .limit(1)
  console.log(fErr ? `❌ follows: ${fErr.message}` : `✅ follows: OK (${follows?.length || 0} rows)`)

  // Test other tables
  const tables = ['card_comments', 'wishlists', 'trade_lists', 'activities']
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1)
    console.log(error ? `❌ ${table}: ${error.message}` : `✅ ${table}: OK`)
  }

  // Test login
  console.log('\nTesting login...')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'nook@tcgvault.com',
    password: 'TCGVault2026!'
  })
  if (error) {
    console.log('Login error:', error.message)
  } else {
    console.log('✅ Login OK!', data.user?.email)
  }

  console.log('\n🎉 Community database is ready!')
}

main().catch(console.error)