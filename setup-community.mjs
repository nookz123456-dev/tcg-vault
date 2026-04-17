import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://hezbxloxsgqwbondebjt.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlemJ4bG94c2dxd2JvbmRlYmp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI0MTYwNywiZXhwIjoyMDkxODE3NjA3fQ.xpulrdLMD209QeBgGpC8BLLLNyw5ftvrd9MmyqqKub0'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  // Test connection first
  console.log('Testing Supabase connection...')
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, username')
    .limit(1)
  
  if (pErr) {
    console.log('Profiles table error:', pErr.message)
  } else {
    console.log('Profiles table exists, current profiles:', profiles)
  }

  // Check if community tables exist
  const tables = ['follows', 'card_comments', 'wishlists', 'trade_lists', 'activities']
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(1)
    if (error) {
      console.log(`Table "${table}": NOT EXISTS (${error.message})`)
    } else {
      console.log(`Table "${table}": EXISTS`)
    }
  }

  // Try to auto-confirm the test user
  console.log('\nTrying to auto-confirm test user...')
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers()
  if (uErr) {
    console.log('List users error:', uErr.message)
  } else {
    console.log(`Found ${users.users.length} users:`)
    for (const u of users.users) {
      console.log(`  - ${u.email} confirmed: ${u.confirmed_at ? 'YES' : 'NO'} id: ${u.id}`)
      if (!u.confirmed_at) {
        const { data: updated, error: cErr } = await supabase.auth.admin.updateUserById(u.id, {
          email_confirm: true,
        })
        if (cErr) {
          console.log(`  Failed to confirm ${u.email}:`, cErr.message)
        } else {
          console.log(`  ✅ Confirmed ${u.email}!`)
        }
      }
    }
  }

  console.log('\nDone! Now run the community-schema.sql in Supabase SQL Editor.')
  console.log('URL: https://supabase.com/dashboard/project/hezbxloxsgqwbondebjt/sql')
}

main().catch(console.error)