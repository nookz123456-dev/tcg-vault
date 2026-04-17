import { createClient } from '@supabase/supabase-js'

// Test with the publishable key from .env.example
const c = createClient(
  'https://hezbxloxsgqwbondebjt.supabase.co',
  'sb_publishable_Y4STzv-8E-iXcivRYswjgQ_H1rFRXdI'
)
c.from('profiles').select('id, username').limit(1)
  .then(r => console.log('publishable key:', r.error ? 'ERROR: ' + r.error.message : 'OK: ' + JSON.stringify(r.data)))
  .catch(e => console.error('Exception:', e.message))