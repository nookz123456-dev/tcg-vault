import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// XP thresholds for each level
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 850, 1300, 1850, 2500, 3250, 4100,
  5050, 6100, 7250, 8500, 9850, 11300, 12850, 14500, 16250, 18100,
  20000,
]

function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

function getNextLevelXp(xp: number): { current: number; next: number; progress: number } {
  const level = getLevel(xp)
  const currentThreshold = LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)] || 0
  const nextThreshold = LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const progress = nextThreshold > currentThreshold ? (xp - currentThreshold) / (nextThreshold - currentThreshold) : 1
  return { current: currentThreshold, next: nextThreshold, progress: Math.min(1, progress) }
}

// Badges with XP rewards
const BADGES = [
  { id: 'first_search', name: 'First Search', description: 'Searched for your first card', icon: '🔍', xp: 10, category: 'exploration' },
  { id: 'card_fan', name: 'Card Fan', description: 'Viewed 10 different cards', icon: '🃏', xp: 25, category: 'exploration' },
  { id: 'deep_diver', name: 'Deep Diver', description: 'Viewed 50 different cards', icon: '🏊', xp: 50, category: 'exploration' },
  { id: 'jp_hunter', name: 'JP Hunter', description: 'Viewed 10 Japanese cards', icon: '🇯🇵', xp: 30, category: 'exploration' },
  { id: 'price_watcher', name: 'Price Watcher', description: 'Created your first price alert', icon: '🔔', xp: 15, category: 'tracking' },
  { id: 'alert_master', name: 'Alert Master', description: 'Created 5 price alerts', icon: '🎯', xp: 40, category: 'tracking' },
  { id: 'wishlist_10', name: 'Wishlist Collector', description: 'Added 10 cards to watchlist', icon: '⭐', xp: 30, category: 'tracking' },
  { id: 'first_trade', name: 'First Trade', description: 'Made your first trade offer', icon: '🤝', xp: 20, category: 'community' },
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Posted 10 comments', icon: '💬', xp: 25, category: 'community' },
  { id: 'seller_pro', name: 'Seller Pro', description: 'Listed your first item for sale', icon: '🏷️', xp: 20, category: 'marketplace' },
  { id: 'grading_guru', name: 'Grading Guru', description: 'Used the Grading ROI Calculator', icon: '💎', xp: 15, category: 'tools' },
  { id: 'market_index', name: 'Market Watcher', description: 'Visited the Market Index page', icon: '📊', xp: 10, category: 'tools' },
  { id: 'level_5', name: 'Rising Star', description: 'Reached Level 5', icon: '⬆️', xp: 50, category: 'milestone' },
  { id: 'level_10', name: 'Veteran', description: 'Reached Level 10', icon: '🏆', xp: 100, category: 'milestone' },
  { id: 'level_20', name: 'Legend', description: 'Reached Level 20', icon: '👑', xp: 200, category: 'milestone' },
]

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    // Return public badge definitions without auth
    return NextResponse.json({ badges: BADGES, levelSystem: { thresholds: LEVEL_THRESHOLDS } })
  }

  const token = authHeader.replace('Bearer ', '')
  const headers: Record<string, string> = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    'Authorization': `Bearer ${token}`,
  }

  // Get user profile
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,xp,level,badges`, { headers })
  const profiles = await profileRes.json()
  if (!profiles?.[0]) {
    return NextResponse.json({ badges: BADGES, levelSystem: { thresholds: LEVEL_THRESHOLDS } })
  }

  const profile = profiles[0]
  const xp = profile.xp || 0
  const level = getLevel(xp)
  const levelInfo = getNextLevelXp(xp)

  return NextResponse.json({
    badges: BADGES,
    levelSystem: { thresholds: LEVEL_THRESHOLDS },
    user: {
      xp,
      level,
      levelInfo,
      earnedBadges: profile.badges || [],
    },
  })
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const body = await request.json()
  const { action } = body

  const serviceHeaders: Record<string, string> = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }

  // Get user profile
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,xp,level,badges`, { headers: serviceHeaders })
  const profiles = await profileRes.json()
  if (!profiles?.[0]) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const profile = profiles[0]
  let xpGain = 0

  // XP rewards per action
  const XP_REWARDS: Record<string, number> = {
    search: 2,
    view_card: 3,
    view_jp_card: 5,
    create_alert: 5,
    add_wishlist: 3,
    create_trade: 10,
    create_comment: 3,
    create_listing: 8,
    use_grading_calc: 5,
    visit_index: 3,
  }

  xpGain = XP_REWARDS[action] || 0
  if (xpGain === 0) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const newXp = (profile.xp || 0) + xpGain
  const newLevel = getLevel(newXp)

  // Update profile
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`, {
    method: 'PATCH',
    headers: serviceHeaders,
    body: JSON.stringify({ xp: newXp, level: newLevel }),
  })

  // Check for new badges
  const earnedBadges: string[] = profile.badges || []
  const newBadges: string[] = []

  // Check level badges
  if (newLevel >= 5 && !earnedBadges.includes('level_5')) newBadges.push('level_5')
  if (newLevel >= 10 && !earnedBadges.includes('level_10')) newBadges.push('level_10')
  if (newLevel >= 20 && !earnedBadges.includes('level_20')) newBadges.push('level_20')

  if (newBadges.length > 0) {
    // Add badge XP bonus
    let badgeXp = 0
    for (const badgeId of newBadges) {
      const badge = BADGES.find(b => b.id === badgeId)
      if (badge) badgeXp += badge.xp
    }
    const finalXp = newXp + badgeXp
    const finalLevel = getLevel(finalXp)
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`, {
      method: 'PATCH',
      headers: serviceHeaders,
      body: JSON.stringify({ xp: finalXp, level: finalLevel, badges: [...earnedBadges, ...newBadges] }),
    })
  }

  return NextResponse.json({
    xpGained: xpGain,
    newXp: newBadges.length > 0 ? newXp + newBadges.reduce((sum, bid) => sum + (BADGES.find(b => b.id === bid)?.xp || 0), 0) : newXp,
    newLevel,
    newBadges,
  })
}