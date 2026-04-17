import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Helper: check if user is admin via service_role
async function isUserAdmin(authToken: string): Promise<{ isAdmin: boolean; userId: string }> {
  // Verify token and get user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${authToken}` },
  })
  if (!userRes.ok) return { isAdmin: false, userId: '' }
  const userData = await userRes.json()

  // Check role in profiles
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}&select=role`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
  })
  if (!profileRes.ok) return { isAdmin: false, userId: userData.id }
  const profiles = await profileRes.json()

  return { isAdmin: profiles?.[0]?.role === 'admin', userId: userData.id }
}

// GET /api/admin/stats — dashboard stats
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const { isAdmin } = await isUserAdmin(token)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const headers = { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` }

  // Fetch all stats in parallel
  const [usersRes, threadsRes, commentsRes, activitiesRes, tradesRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,username,display_name,role,created_at&order=created_at.desc&limit=50`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?select=id,title,created_at&order=created_at.desc&limit=20`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/discussion_replies?select=id,thread_id,content,created_at&order=created_at.desc&limit=20`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/activities?select=*&order=created_at.desc&limit=20`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/trade_offers?select=*&order=created_at.desc&limit=20`, { headers }),
  ])

  const users = await usersRes.json()
  const threads = await threadsRes.json()
  const comments = await commentsRes.json()
  const activities = await activitiesRes.json()
  const trades = await tradesRes.json()

  // Count totals
  const [totalUsersRes, totalThreadsRes, totalCommentsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?select=id`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/discussion_replies?select=id`, { headers }),
  ])

  const totalUsers = (await totalUsersRes.json())?.length || 0
  const totalThreads = (await totalThreadsRes.json())?.length || 0
  const totalComments = (await totalCommentsRes.json())?.length || 0

  return NextResponse.json({
    stats: {
      totalUsers,
      totalThreads,
      totalComments,
      totalActivities: activities?.length || 0,
      totalTrades: trades?.length || 0,
    },
    recentUsers: users || [],
    recentThreads: threads || [],
    recentComments: comments || [],
    recentActivities: activities || [],
    recentTrades: trades || [],
  })
}

// PATCH /api/admin — update user role or delete content
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const { isAdmin } = await isUserAdmin(token)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const body = await request.json()
  const { action, userId, role, threadId, threadPinned, replyId } = body

  const headers = { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }

  if (action === 'updateRole' && userId && role) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    return NextResponse.json({ success: true, profile: data?.[0] })
  }

  if (action === 'togglePin' && threadId !== undefined) {
    // Get current pinned state
    const currentRes = await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?id=eq.${threadId}&select=is_pinned`, { headers })
    const current = await currentRes.json()
    const newPinned = !(current?.[0]?.is_pinned)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?id=eq.${threadId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_pinned: newPinned }),
    })
    const data = await res.json()
    return NextResponse.json({ success: true, thread: data?.[0] })
  }

  if (action === 'deleteThread' && threadId) {
    await fetch(`${SUPABASE_URL}/rest/v1/discussion_replies?thread_id=eq.${threadId}`, {
      method: 'DELETE',
      headers,
    })
    await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?id=eq.${threadId}`, {
      method: 'DELETE',
      headers,
    })
    return NextResponse.json({ success: true })
  }

  if (action === 'deleteReply' && replyId) {
    await fetch(`${SUPABASE_URL}/rest/v1/discussion_replies?id=eq.${replyId}`, {
      method: 'DELETE',
      headers,
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}