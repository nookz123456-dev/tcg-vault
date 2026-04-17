// Seed with REAL Supabase Auth users
// Run: node seed-real-users.mjs

const SUPABASE_URL = 'https://hezbxloxsgqwbondebjt.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlemJ4bG94c2dxd2JvbmRlYmp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI0MTYwNywiZXhwIjoyMDkxODE3NjA3fQ.xpulrdLMD209QeBgGpC8BLLLNyw5ftvrd9MmyqqKub0'

const authHeaders = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

const restHeaders = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

async function supabaseRest(table, method, body, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`, {
    method,
    headers: method === 'GET' || method === 'DELETE' 
      ? { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` }
      : restHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok && method !== 'DELETE') {
    const err = await res.text()
    return { error: err.substring(0, 300) }
  }
  if (res.status === 204 || method === 'DELETE') return { ok: true }
  return res.json()
}

async function createUser(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true, // Auto-confirm
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    // If already exists, try to get existing user
    if (err.includes('already registered') || err.includes('already been registered')) {
      console.log(`  ⏭️ User ${email} already exists, looking up...`)
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?filter=email:eq:${email}`, {
        headers: authHeaders,
      })
      if (listRes.ok) {
        const data = await listRes.json()
        if (data.users && data.users.length > 0) return data.users[0]
      }
    }
    console.error(`  ❌ Create user ${email}:`, err.substring(0, 200))
    return null
  }
  return res.json()
}

async function main() {
  console.log('🌱 Seeding with REAL Supabase Auth users...\n')

  // 1. Create auth users
  const testUsers = [
    { email: 'pikacollector@tcgvault.com', password: 'TestSeed123!', username: 'PikaCollector', display_name: 'PikaCollector', bio: 'Pokemon TCG collector since 1999. Chasing that 1st Edition Charizard! 🔥' },
    { email: 'luffyfan99@tcgvault.com', password: 'TestSeed123!', username: 'LuffyFan99', display_name: 'LuffyFan99', bio: 'One Piece card game enthusiast. Red deck main 🏴‍☠️' },
    { email: 'cardmaster@tcgvault.com', password: 'TestSeed123!', username: 'CardMaster', display_name: 'CardMaster', bio: 'Graded card specialist. PSA 10 or nothing 💎' },
    { email: 'jpcardhunter@tcgvault.com', password: 'TestSeed123!', username: 'JPCardHunter', display_name: 'JPCardHunter', bio: 'Japanese card collector. Current focus: Scarlet Violet JP sets 🇯🇵' },
    { email: 'thaitrader@tcgvault.com', password: 'TestSeed123!', username: 'ThaiTrader', display_name: 'ThaiTrader', bio: 'นักสะสมการ์ดไทย ชอบ Pokemon EN และ One Piece 🇹🇭' },
  ]

  const userIds = []
  for (const u of testUsers) {
    const user = await createUser(u.email, u.password)
    if (user) {
      userIds.push({ id: user.id, ...u })
      console.log(`  ✅ Auth user: ${u.username} (${user.id.substring(0, 8)}...)`)
    } else {
      console.log(`  ❌ Failed: ${u.username}`)
    }
  }

  if (userIds.length === 0) {
    console.log('\n❌ No users created. Cannot seed data.')
    return
  }

  // 2. Upsert profiles
  console.log('\n📝 Updating profiles...')
  for (const u of userIds) {
    const result = await supabaseRest('profiles', 'PATCH', {
      username: u.username,
      display_name: u.display_name,
      bio: u.bio,
      is_public: true,
      collection_public: true,
    }, `id=eq.${u.id}`)
    // Check if profile exists
    const existing = await supabaseRest('profiles', 'GET', null, `id=eq.${u.id}`)
    if (Array.isArray(existing) && existing.length === 0) {
      // Profile doesn't exist yet (trigger might not have fired), insert it
      await supabaseRest('profiles', 'POST', {
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        bio: u.bio,
        is_public: true,
        collection_public: true,
      })
      console.log(`  ✅ Inserted profile: ${u.username}`)
    } else {
      console.log(`  ✅ Updated profile: ${u.username}`)
    }
  }

  // 3. Seed activities
  console.log('\n📡 Seeding activities...')
  const now = new Date()
  const activities = [
    { user_id: userIds[0]?.id, action: 'added_to_collection', card_id: 'base1-4', game: 'pokemon', metadata: { card_name: 'Charizard' }, created_at: new Date(now.getTime() - 2 * 60000).toISOString() },
    { user_id: userIds[1]?.id, action: 'added_to_collection', card_id: 'OP01-001', game: 'onepiece', metadata: { card_name: 'Monkey D. Luffy' }, created_at: new Date(now.getTime() - 15 * 60000).toISOString() },
    { user_id: userIds[2]?.id, action: 'added_to_wishlist', card_id: 'sv3pt5-201', game: 'pokemon', metadata: { card_name: 'Alakazam ex' }, created_at: new Date(now.getTime() - 30 * 60000).toISOString() },
    { user_id: userIds[3]?.id, action: 'added_to_collection', card_id: 'SV2D-017', game: 'pokemon-jp', metadata: { card_name: 'Charizard JP' }, created_at: new Date(now.getTime() - 45 * 60000).toISOString() },
    { user_id: userIds[4]?.id, action: 'added_to_collection', card_id: 'sv4pt5-3', game: 'pokemon', metadata: { card_name: 'Pikachu ex' }, created_at: new Date(now.getTime() - 60 * 60000).toISOString() },
    { user_id: userIds[0]?.id, action: 'added_to_collection', card_id: 'sv3pt5-178', game: 'pokemon', metadata: { card_name: 'Mew ex' }, created_at: new Date(now.getTime() - 120 * 60000).toISOString() },
    { user_id: userIds[2]?.id, action: 'posted_comment', card_id: 'base1-4', game: 'pokemon', metadata: {}, created_at: new Date(now.getTime() - 180 * 60000).toISOString() },
    { user_id: userIds[1]?.id, action: 'listed_for_trade', card_id: 'OP02-001', game: 'onepiece', metadata: {}, created_at: new Date(now.getTime() - 240 * 60000).toISOString() },
    { user_id: userIds[3]?.id, action: 'added_to_collection', card_id: 'SV4a-001', game: 'pokemon-jp', metadata: {}, created_at: new Date(now.getTime() - 300 * 60000).toISOString() },
    { user_id: userIds[4]?.id, action: 'added_to_wishlist', card_id: 'OP01-001', game: 'onepiece', metadata: {}, created_at: new Date(now.getTime() - 360 * 60000).toISOString() },
  ].filter(a => a.user_id)

  // Delete old seed activities
  for (const u of userIds) {
    await supabaseRest('activities', 'DELETE', null, `user_id=eq.${u.id}`)
  }

  const actResult = await supabaseRest('activities', 'POST', activities)
  if (actResult.error) {
    console.error(`  ❌ Activities:`, actResult.error)
  } else {
    console.log(`  ✅ Created ${activities.length} activities`)
  }

  // 4. Seed discussion threads
  console.log('\n💬 Seeding discussion threads...')
  const boards = await supabaseRest('discussion_boards', 'GET', null, 'select=id,slug,name')
  const boardMap = {}
  if (Array.isArray(boards)) boards.forEach(b => boardMap[b.slug] = b.id)

  const threads = [
    { board_id: boardMap['pokemon-tcg'], user_id: userIds[0]?.id, title: 'Best Charizard card of all time?', content: 'I think the 1st Edition Base Set Charizard is still the GOAT. But the modern alt arts are amazing too. What do you think?', is_pinned: true, views: 342 },
    { board_id: boardMap['pokemon-tcg'], user_id: userIds[2]?.id, title: 'PSA 10 grading tips for beginners', content: 'After submitting 200+ cards for grading, here are my top tips:\n1) Always use penny sleeves\n2) Check centering under magnification\n3) Look for print lines before submitting\n\nHope this helps!', is_pinned: false, views: 156 },
    { board_id: boardMap['pokemon-tcg'], user_id: userIds[3]?.id, title: 'JP vs EN cards - which holds value better?', content: 'I have been comparing JP and EN card prices. JP alt arts tend to be cheaper but some are exclusive to Japan. What is your experience?', is_pinned: false, views: 89 },
    { board_id: boardMap['one-piece-tcg'], user_id: userIds[1]?.id, title: 'OP-15 meta analysis - Red/Green Luffy', content: 'The new Red/Green Luffy leader from OP-15 looks insane. Anyone tested it yet? I think it might be tier 1.', is_pinned: false, views: 234 },
    { board_id: boardMap['one-piece-tcg'], user_id: userIds[4]?.id, title: 'One Piece card prices in Thailand', content: 'ใครซื้อการ์ด One Piece ในไทยบ้างครับ ราคาต่างจาก TCGplayer เยอะไหม? ผมหาซื้อยากพอสมควร', is_pinned: false, views: 67 },
    { board_id: boardMap['market-talk'], user_id: userIds[2]?.id, title: 'Pokemon market is heating up in 2026', content: 'Scarlet Violet sets are going crazy. Obsidian Flames up 40% this quarter. Is the bubble back or is this organic growth?', is_pinned: true, views: 445 },
    { board_id: boardMap['market-talk'], user_id: userIds[0]?.id, title: 'Should I sell or hold my Alt Art Charizard?', content: 'Got the SV3 Obsidian Flames Charizard ex alt art for $80 and now it is $180. Take profits or diamond hands?', is_pinned: false, views: 312 },
    { board_id: boardMap['show-and-tell'], user_id: userIds[3]?.id, title: 'My JP Scarlet Violet master set!', content: 'Finally completed my SV1-SV4 Japanese master set! Took 8 months and way too much money. But it looks beautiful. 🎉', is_pinned: false, views: 178 },
    { board_id: boardMap['show-and-tell'], user_id: userIds[4]?.id, title: 'First PSA 10 pull - Pikachu VMAX!', content: 'Just got my PSA 10 Pikachu VMAX Rainbow back! So happy! This is my first PSA 10 card ever. The feeling is amazing!', is_pinned: false, views: 203 },
    { board_id: boardMap['trading-hub'], user_id: userIds[1]?.id, title: 'WTT: OP01 Luffy for OP03 Law', content: 'Looking to trade my OP01-001 Luffy (NM) for OP03 Law. Message me if interested!', is_pinned: false, views: 56 },
    { board_id: boardMap['general'], user_id: userIds[0]?.id, title: 'Welcome to TCG Vault!', content: 'Glad to be part of this community. Just discovered the site and already love the price tracking features. Looking forward to trading with everyone! 🎴', is_pinned: true, views: 789 },
    { board_id: boardMap['general'], user_id: userIds[2]?.id, title: 'Best card storage recommendations?', content: 'Currently using Ultra Pro binders but running out of space. What do you recommend for long-term storage of 500+ cards?', is_pinned: false, views: 134 },
  ].filter(t => t.user_id && t.board_id)

  for (const u of userIds) {
    await supabaseRest('discussion_threads', 'DELETE', null, `user_id=eq.${u.id}`)
  }

  const insertedThreads = await supabaseRest('discussion_threads', 'POST', threads)
  if (insertedThreads.error) {
    console.error(`  ❌ Threads:`, insertedThreads.error.substring(0, 200))
  } else {
    console.log(`  ✅ Created ${threads.length} threads`)
  }

  // 5. Thread replies
  if (Array.isArray(insertedThreads) && insertedThreads.length > 0) {
    console.log('\n↩️ Seeding thread replies...')
    const replies = insertedThreads.slice(0, 4).flatMap((thread, i) => [
      {
        thread_id: thread.id,
        user_id: userIds[(i + 1) % userIds.length]?.id,
        content: ['1st Edition is definitely the GOAT. The holo pattern is unmatched!', 'Great tips! Also check for surface scratches under direct light.', 'JP cards hold value longer because of the collector culture in Japan.', 'Red/Green Luffy is going to be meta for sure. The draw engine is broken.'][i],
        created_at: new Date(now.getTime() - (60 + i * 30) * 60000).toISOString(),
      },
      {
        thread_id: thread.id,
        user_id: userIds[(i + 2) % userIds.length]?.id,
        content: ['Modern alt arts have better artwork but 1st Ed has nostalgia.', 'My PSA 10 rate went from 65% to 80% after following these tips!', 'JP print quality is consistently better than EN.', 'Played against it last week and got destroyed. Need a counter.'][i],
        created_at: new Date(now.getTime() - (30 + i * 15) * 60000).toISOString(),
      },
    ]).filter(r => r.user_id)

    await supabaseRest('discussion_replies', 'POST', replies)
    console.log(`  ✅ Created ${replies.length} replies`)
  }

  // 6. Follows
  console.log('\n👤 Seeding follows...')
  const follows = [
    { follower_id: userIds[0]?.id, following_id: userIds[2]?.id },
    { follower_id: userIds[1]?.id, following_id: userIds[0]?.id },
    { follower_id: userIds[2]?.id, following_id: userIds[3]?.id },
    { follower_id: userIds[4]?.id, following_id: userIds[0]?.id },
    { follower_id: userIds[4]?.id, following_id: userIds[1]?.id },
    { follower_id: userIds[3]?.id, following_id: userIds[2]?.id },
  ].filter(f => f.follower_id && f.following_id)

  for (const u of userIds) {
    await supabaseRest('follows', 'DELETE', null, `follower_id=eq.${u.id}`)
  }
  await supabaseRest('follows', 'POST', follows)
  console.log(`  ✅ Created ${follows.length} follows`)

  // 7. Card comments
  console.log('\n💬 Seeding card comments...')
  const comments = [
    { user_id: userIds[0]?.id, card_id: 'base1-4', game: 'pokemon', content: 'The OG Charizard. Every collector needs at least one! 🔥', created_at: new Date(now.getTime() - 10 * 60000).toISOString() },
    { user_id: userIds[2]?.id, card_id: 'base1-4', game: 'pokemon', content: 'PSA 10 of this card sold for $420k last year. Insane.', created_at: new Date(now.getTime() - 5 * 60000).toISOString() },
    { user_id: userIds[1]?.id, card_id: 'OP01-001', game: 'onepiece', content: 'Best Luffy card design in the game! The pose is iconic. 🏴‍☠️', created_at: new Date(now.getTime() - 20 * 60000).toISOString() },
    { user_id: userIds[3]?.id, card_id: 'SV2D-017', game: 'pokemon-jp', content: 'Japanese print quality is always top tier. Different holo pattern from EN.', created_at: new Date(now.getTime() - 35 * 60000).toISOString() },
  ].filter(c => c.user_id)

  for (const u of userIds) {
    await supabaseRest('card_comments', 'DELETE', null, `user_id=eq.${u.id}`)
  }
  await supabaseRest('card_comments', 'POST', comments)
  console.log(`  ✅ Created ${comments.length} card comments`)

  // 8. Wishlists
  console.log('\n💭 Seeding wishlists...')
  const wishlists = [
    { user_id: userIds[2]?.id, card_id: 'base1-4', game: 'pokemon', created_at: new Date(now.getTime() - 100 * 60000).toISOString() },
    { user_id: userIds[4]?.id, card_id: 'OP01-001', game: 'onepiece', created_at: new Date(now.getTime() - 200 * 60000).toISOString() },
    { user_id: userIds[0]?.id, card_id: 'sv3pt5-201', game: 'pokemon', created_at: new Date(now.getTime() - 150 * 60000).toISOString() },
  ].filter(w => w.user_id)

  for (const u of userIds) {
    await supabaseRest('wishlists', 'DELETE', null, `user_id=eq.${u.id}`)
  }
  await supabaseRest('wishlists', 'POST', wishlists)
  console.log(`  ✅ Created ${wishlists.length} wishlist items`)

  // 9. Trade offers
  console.log('\n🤝 Seeding trade offers...')
  const trades = [
    { from_user_id: userIds[1]?.id, to_user_id: userIds[0]?.id, offered_card_id: 'OP01-001', offered_game: 'onepiece', offered_condition: 'Near Mint', requested_card_id: 'base1-4', requested_game: 'pokemon', requested_condition: 'Lightly Played', status: 'pending', message: 'Hey! Would you trade your Charizard for my Luffy?' },
    { from_user_id: userIds[4]?.id, to_user_id: userIds[2]?.id, offered_card_id: 'sv3pt5-92', offered_game: 'pokemon', offered_condition: 'Near Mint', requested_card_id: 'sv3pt5-201', requested_game: 'pokemon', requested_condition: 'Near Mint', status: 'accepted', message: 'Love to trade with you!' },
  ].filter(t => t.from_user_id && t.to_user_id)

  for (const u of userIds) {
    await supabaseRest('trade_offers', 'DELETE', null, `from_user_id=eq.${u.id}`)
  }
  await supabaseRest('trade_offers', 'POST', trades)
  console.log(`  ✅ Created ${trades.length} trade offers`)

  console.log('\n🎉 Seed complete! All community pages now have REAL sample data.')
  console.log('\nTest accounts (can log in):')
  for (const u of testUsers) {
    console.log(`  ${u.username}: ${u.email} / TestSeed123!`)
  }
}

main().catch(console.error)