import { createClient } from '@supabase/supabase-js'
const c = createClient(
  'https://hezbxloxsgqwbondebjt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlemJ4bG94c2dxd2JvbmRlYmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNDE2MDcsImV4cCI6MjA5MTgxNzYwN30.Z5RK0M0q2bXfXhK_Qh0Vn3i5bqJ8KLdFz3W-7HCqN1A'
)
c.from('profiles').select('id, username').limit(1)
  .then(r => console.log(r.error ? 'ERROR: ' + r.error.message : 'OK: ' + JSON.stringify(r.data)))
  .catch(e => console.error('Exception:', e.message))