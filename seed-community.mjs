// Seed data script - adds sample data to make community pages look alive
// Run: node seed-community.mjs

const SUPABASE_URL = 'https://hezbxloxsgqwbondebjt.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlemJ4bG94c2dxd2JvbmRlYmp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI0MTYwNywiZXhwIjoyMDkxODE3NjA3fQ.xpulrdLMD209QeBgGpC8BLLLNyw5ftvrd9MmyqqKub0'

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

async function supabaseInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error(`Failed to insert into ${table}:`, err.substring(0, 200))
    return null
  }
  return res.json()
}

async function supabaseQuery(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
  })
  if (!res.ok) return []
  return res.json()
}

async function supabaseDelete(table, query) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'DELETE',
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
  })
}

// Valid UUIDs for seed users
const USER_IDS = [
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
]

async function main() {
  console.log('🌱 Seeding community data...')

  // 1. Create sample profiles
  const sampleUsers = [
    { id: USER_IDS[0], username: 'PikaCollector', display_name: 'PikaCollector', bio: 'Pokemon TCG collector since 1999. Chasing that 1st Edition Charizard! 🔥', is_public: true, collection_public: true },
    { id: USER_IDS[1], username: 'LuffyFan99', display_name: 'LuffyFan99', bio: 'One Piece card game enthusiast. Red deck main 🏴‍☠️', is_public: true, collection_public: true },
    { id: USER_IDS[2], username: 'CardMaster', display_name: 'CardMaster', bio: 'Graded card specialist. PSA 10 or nothing 💎', is_public: true, collection_public: true },
    { id: USER_IDS[3], username: 'JPCardHunter', display_name: 'JPCardHunter', bio: 'Japanese card collector. Current focus: Scarlet Violet JP sets 🇯🇵', is_public: true, collection_public: true },
    { id: USER_IDS[4], username: 'ThaiTrader', display_name: 'ThaiTrader', bio: 'นักสะสมการ์ดไทย ชอบ Pokemon EN และ One Piece 🇹🇭', is_public: true, collection_public: true },
  ]

  for (const user of sampleUsers) {
    const existing = await supabaseQuery('profiles', `id=eq.${user.id}`)
    if (existing.length === 0) {
      await supabaseInsert('profiles', user)
      console.log(`  ✅ Created profile: ${user.username}`)
    } else {
      console.log(`  ⏭️ Profile exists: ${user.username}`)
    }
  }

  // 2. Create activities
  const now = new Date()
  const activities = [
    { user_id: USER_IDS[0], action: 'added_to_collection', card_id: 'base1-4', game: 'pokemon', metadata: { card_name: 'Charizard' }, created_at: new Date(now.getTime() - 2 * 60000).toISOString() },
    { user_id: USER_IDS[1], action: 'added_to_collection', card_id: 'OP01-001', game: 'onepiece', metadata: { card_name: 'Monkey D. Luffy' }, created_at: new Date(now.getTime() - 15 * 60000).toISOString() },
    { user_id: USER_IDS[2], action: 'added_to_wishlist', card_id: 'sv3pt5-201', game: 'pokemon', metadata: { card_name: 'Alakazam ex' }, created_at: new Date(now.getTime() - 30 * 60000).toISOString() },
    { user_id: USER_IDS[3], action: 'added_to_collection', card_id: 'SV2D-017', game: 'pokemon-jp', metadata: { card_name: 'リザードン' }, created_at: new Date(now.getTime() - 45 * 60000).toISOString() },
    { user_id: USER_IDS[4], action: 'added_to_collection', card_id: 'sv4pt5-3', game: 'pokemon', metadata: { card_name: 'Pikachu ex' }, created_at: new Date(now.getTime() - 60 * 60000).toISOString() },
    { user_id: USER_IDS[0], action: 'added_to_collection', card_id: 'sv3pt5-178', game: 'pokemon', metadata: { card_name: 'Mew ex' }, created_at: new Date(now.getTime() - 120 * 60000).toISOString() },
    { user_id: USER_IDS[2], action: 'posted_comment', card_id: 'base1-4', game: 'pokemon', metadata: { card_name: 'Charizard' }, created_at: new Date(now.getTime() - 180 * 60000).toISOString() },
    { user_id: USER_IDS[1], action: 'listed_for_trade', card_id: 'OP02-001', game: 'onepiece', metadata: { card_name: 'Luffy OP02' }, created_at: new Date(now.getTime() - 240 * 60000).toISOString() },
    { user_id: USER_IDS[3], action: 'added_to_collection', card_id: 'SV4a-001', game: 'pokemon-jp', metadata: {}, created_at: new Date(now.getTime() - 300 * 60000).toISOString() },
    { user_id: USER_IDS[4], action: 'added_to_wishlist', card_id: 'OP01-001', game: 'onepiece', metadata: {}, created_at: new Date(now.getTime() - 360 * 60000).toISOString() },
    { user_id: USER_IDS[0], action: 'added_to_collection', card_id: 'base4-3', game: 'pokemon', metadata: { card_name: 'Charizard Base Set 4' }, created_at: new Date(now.getTime() - 420 * 60000).toISOString() },
    { user_id: USER_IDS[2], action: 'added_to_collection', card_id: 'sv3pt5-92', game: 'pokemon', metadata: {}, created_at: new Date(now.getTime() - 480 * 60000).toISOString() },
  ]

  // Clear old seed activities
  await supabaseDelete('activities', `user_id=eq.${USER_IDS[0]}`)
  await supabaseDelete('activities', `user_id=eq.${USER_IDS[1]}`)
  await supabaseDelete('activities', `user_id=eq.${USER_IDS[2]}`)
  await supabaseDelete('activities', `user_id=eq.${USER_IDS[3]}`)
  await supabaseDelete('activities', `user_id=eq.${USER_IDS[4]}`)

  await supabaseInsert('activities', activities)
  console.log(`  ✅ Created ${activities.length} activities`)

  // 3. Create discussion threads
  const boards = await supabaseQuery('discussion_boards', 'select=id,slug,name')
  console.log(`  📋 Found ${boards.length} boards`)

  const boardMap = {}
  boards.forEach(b => boardMap[b.slug] = b.id)

  const threads = [
    { board_id: boardMap['pokemon-tcg'], user_id: USER_IDS[0], title: 'Best Charizard card of all time?', content: 'I think the 1st Edition Base Set Charizard is still the GOAT. But the modern alt arts are amazing too. What do you think?', is_pinned: true, views: 342 },
    { board_id: boardMap['pokemon-tcg'], user_id: USER_IDS[2], title: 'PSA 10 grading tips for beginners', content: 'After submitting 200+ cards for grading, here are my top tips: 1) Always use penny sleeves 2) Check centering under magnification 3) Look for print lines before submitting. Hope this helps!', is_pinned: false, views: 156 },
    { board_id: boardMap['pokemon-tcg'], user_id: USER_IDS[3], title: 'JP vs EN cards - which holds value better?', content: 'I have been comparing JP and EN card prices. JP alt arts tend to be cheaper but some are exclusive to Japan. What is your experience?', is_pinned: false, views: 89 },
    { board_id: boardMap['one-piece-tcg'], user_id: USER_IDS[1], title: 'OP-15 meta analysis - Red/Green Luffy', content: 'The new Red/Green Luffy leader from OP-15 looks insane. Anyone tested it yet? I think it might be tier 1.', is_pinned: false, views: 234 },
    { board_id: boardMap['one-piece-tcg'], user_id: USER_IDS[4], title: 'One Piece card prices in Thailand', content: 'ใครซื้อการ์ด One Piece ในไทยบ้างครับ ราคาต่างจาก TCGplayer เยอะไหม? ผมหาซื้อยากพอสมควร', is_pinned: false, views: 67 },
    { board_id: boardMap['market-talk'], user_id: USER_IDS[2], title: 'Pokemon market is heating up in 2026', content: 'Scarlet Violet sets are going crazy. Obsidian Flames up 40% this quarter. Is the bubble back or is this organic growth?', is_pinned: true, views: 445 },
    { board_id: boardMap['market-talk'], user_id: USER_IDS[0], title: 'Should I sell or hold my Alt Art Charizard?', content: 'Got the SV3 Obsidian Flames Charizard ex alt art for $80 and now it is $180. Take profits or diamond hands?', is_pinned: false, views: 312 },
    { board_id: boardMap['show-and-tell'], user_id: USER_IDS[3], title: 'My JP Scarlet Violet master set!', content: 'Finally completed my SV1-SV4 Japanese master set! Took 8 months and way too much money. But it looks beautiful. Will post pictures soon.', is_pinned: false, views: 178 },
    { board_id: boardMap['show-and-tell'], user_id: USER_IDS[4], title: 'First PSA 10 pull - Pikachu VMAX!', content: 'Just got my PSA 10 Pikachu VMAX Rainbow back! So happy! This is my first PSA 10 card ever. The feeling is amazing!', is_pinned: false, views: 203 },
    { board_id: boardMap['trading-hub'], user_id: USER_IDS[1], title: 'WTT: OP01 Luffy for OP03 Law', content: 'Looking to trade my OP01-001 Luffy (NM) for OP03 Law. PM me if interested!', is_pinned: false, views: 56 },
    { board_id: boardMap['general'], user_id: USER_IDS[0], title: 'Welcome to TCG Vault!', content: 'Glad to be part of this community. Just discovered the site and already love the price tracking features. Looking forward to trading with everyone!', is_pinned: true, views: 789 },
    { board_id: boardMap['general'], user_id: USER_IDS[2], title: 'Best card storage recommendations?', content: 'Currently using Ultra Pro binders but running out of space. What do you recommend for long-term storage of 500+ cards? Looking at VaultX and Zipbind.', is_pinned: false, views: 134 },
  ]

  // Clear old seed threads
  for (const uid of USER_IDS) {
    await supabaseDelete('discussion_threads', `user_id=eq.${uid}`)
  }

  const insertedThreads = await supabaseInsert('discussion_threads', threads)
  console.log(`  ✅ Created ${threads.length} discussion threads`)

  // 4. Create replies
  if (insertedThreads && insertedThreads.length > 0) {
    const replies = insertedThreads.slice(0, 4).flatMap((thread, i) => [
      {
        thread_id: thread.id,
        user_id: USER_IDS[(i + 1) % 5],
        content: i === 0
          ? '1st Edition is definitely the GOAT. The holo pattern is unmatched!'
          : i === 1
          ? 'Great tips! I would also add: check for surface scratches under direct light before submitting.'
          : i === 2
          ? 'In my experience JP cards hold value longer because of the collector culture in Japan.'
          : 'Red/Green Luffy is going to be meta for sure. The card draw engine is broken.',
        created_at: new Date(now.getTime() - (60 + i * 30) * 60000).toISOString(),
      },
      {
        thread_id: thread.id,
        user_id: USER_IDS[(i + 2) % 5],
        content: i === 0
          ? 'Modern alt arts have better artwork IMO but the 1st Ed has the nostalgia factor.'
          : i === 1
          ? 'This is super helpful. My first submission had a 65% PSA 10 rate. After following these tips it went up to 80%.'
          : i === 2
          ? 'JP alt arts are also sometimes different from the EN version. The Japanese print quality is consistently better.'
          : 'Agreed! Played against it last week and got destroyed. Need a counter strategy.',
        created_at: new Date(now.getTime() - (30 + i * 15) * 60000).toISOString(),
      },
    ])

    await supabaseInsert('discussion_replies', replies)
    console.log(`  ✅ Created ${replies.length} thread replies`)
  }

  // 5. Create follows
  const follows = [
    { follower_id: USER_IDS[0], following_id: USER_IDS[2] },
    { follower_id: USER_IDS[1], following_id: USER_IDS[0] },
    { follower_id: USER_IDS[2], following_id: USER_IDS[3] },
    { follower_id: USER_IDS[4], following_id: USER_IDS[0] },
    { follower_id: USER_IDS[4], following_id: USER_IDS[1] },
    { follower_id: USER_IDS[3], following_id: USER_IDS[2] },
  ]

  for (const uid of USER_IDS) {
    await supabaseDelete('follows', `follower_id=eq.${uid}`)
  }

  await supabaseInsert('follows', follows)
  console.log(`  ✅ Created ${follows.length} follows`)

  // 6. Card comments
  const comments = [
    { user_id: USER_IDS[0], card_id: 'base1-4', game: 'pokemon', content: 'The OG Charizard. Every collector needs at least one! 🔥', created_at: new Date(now.getTime() - 10 * 60000).toISOString() },
    { user_id: USER_IDS[2], card_id: 'base1-4', game: 'pokemon', content: 'PSA 10 of this card sold for $420k last year. Insane.', created_at: new Date(now.getTime() - 5 * 60000).toISOString() },
    { user_id: USER_IDS[1], card_id: 'OP01-001', game: 'onepiece', content: 'Best Luffy card design in the game! The pose is iconic.', created_at: new Date(now.getTime() - 20 * 60000).toISOString() },
    { user_id: USER_IDS[3], card_id: 'SV2D-017', game: 'pokemon-jp', content: 'Japanese print quality is always top tier. The holo pattern is different from EN.', created_at: new Date(now.getTime() - 35 * 60000).toISOString() },
  ]

  for (const uid of USER_IDS) {
    await supabaseDelete('card_comments', `user_id=eq.${uid}`)
  }

  await supabaseInsert('card_comments', comments)
  console.log(`  ✅ Created ${comments.length} card comments`)

  // 7. Wishlist items
  const wishlists = [
    { user_id: USER_IDS[2], card_id: 'base1-4', game: 'pokemon', created_at: new Date(now.getTime() - 100 * 60000).toISOString() },
    { user_id: USER_IDS[4], card_id: 'OP01-001', game: 'onepiece', created_at: new Date(now.getTime() - 200 * 60000).toISOString() },
    { user_id: USER_IDS[0], card_id: 'sv3pt5-201', game: 'pokemon', created_at: new Date(now.getTime() - 150 * 60000).toISOString() },
  ]

  for (const uid of USER_IDS) {
    await supabaseDelete('wishlists', `user_id=eq.${uid}`)
  }

  await supabaseInsert('wishlists', wishlists)
  console.log(`  ✅ Created ${wishlists.length} wishlist items`)

  // 8. Trade offers
  const trades = [
    { from_user_id: USER_IDS[1], to_user_id: USER_IDS[0], offered_card_id: 'OP01-001', offered_game: 'onepiece', offered_condition: 'Near Mint', requested_card_id: 'base1-4', requested_game: 'pokemon', requested_condition: 'Lightly Played', status: 'pending', message: 'Hey! Would you trade your Charizard for my Luffy?' },
    { from_user_id: USER_IDS[4], to_user_id: USER_IDS[2], offered_card_id: 'sv3pt5-92', offered_game: 'pokemon', offered_condition: 'Near Mint', requested_card_id: 'sv3pt5-201', requested_game: 'pokemon', requested_condition: 'Near Mint', status: 'accepted', message: 'Love to trade with you!' },
  ]

  for (const uid of USER_IDS) {
    await supabaseDelete('trade_offers', `from_user_id=eq.${uid}`)
  }

  await supabaseInsert('trade_offers', trades)
  console.log(`  ✅ Created ${trades.length} trade offers`)

  console.log('\n🎉 Seed complete! All community pages now have sample data.')
}

main().catch(console.error)