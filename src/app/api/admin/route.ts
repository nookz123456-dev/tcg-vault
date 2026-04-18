import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function isUserAdmin(authToken: string): Promise<{ isAdmin: boolean; userId: string }> {
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${authToken}` },
  })
  if (!userRes.ok) return { isAdmin: false, userId: '' }
  const userData = await userRes.json()

  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}&select=role`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
  })
  if (!profileRes.ok) return { isAdmin: false, userId: userData.id }
  const profiles = await profileRes.json()
  return { isAdmin: profiles?.[0]?.role === 'admin', userId: userData.id }
}

// GET /api/admin — comprehensive dashboard data
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
  const url = new URL(request.url)
  const section = url.searchParams.get('section') || 'overview'

  // Overview stats
  if (section === 'overview') {
    const [usersRes, threadsRes, commentsRes, sellersRes, tradesRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?select=id`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/discussion_replies?select=id`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?select=id,status`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/trade_offers?select=id,status`, { headers }),
    ])
    const totalUsers = (await usersRes.json())?.length || 0
    const totalThreads = (await threadsRes.json())?.length || 0
    const totalComments = (await commentsRes.json())?.length || 0
    const sellers: any[] = (await sellersRes.json()) || []
    const trades: any[] = (await tradesRes.json()) || 0
    const pendingSellers = sellers.filter(s => s.status === 'pending').length
    const verifiedSellers = sellers.filter(s => s.status === 'verified').length
    const completedTrades = Array.isArray(trades) ? trades.filter((t: any) => t.status === 'completed').length : 0

    // Recent items
    const [recentUsersRes, recentThreadsRes, recentActivitiesRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,username,display_name,role,created_at&order=created_at.desc&limit=10`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?select=id,title,is_pinned,created_at&order=created_at.desc&limit=10`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/activities?select=*&order=created_at.desc&limit=10`, { headers }),
    ])
    const recentUsers = await recentUsersRes.json()
    const recentThreads = await recentThreadsRes.json()
    const recentActivities = await recentActivitiesRes.json()

    return NextResponse.json({
      stats: { totalUsers, totalThreads, totalComments, pendingSellers, verifiedSellers, completedTrades },
      recentUsers: recentUsers || [],
      recentThreads: recentThreads || [],
      recentActivities: recentActivities || [],
    })
  }

  // Users section
  if (section === 'users') {
    const search = url.searchParams.get('search') || ''
    let query = 'select=id,username,display_name,role,created_at,seller_status&order=created_at.desc&limit=50'
    if (search) query += `&or=(username.ilike.*${search}*,display_name.ilike.*${search}*)`
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?${query}`, { headers })
    const users = await res.json()
    return NextResponse.json({ users: users || [] })
  }

  // Sellers section
  if (section === 'sellers') {
    const status = url.searchParams.get('status') || 'all'
    let query = 'select=*,profiles(id,username,display_name)&order=created_at.desc&limit=50'
    if (status !== 'all') query += `&status=eq.${status}`
    const res = await fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?${query}`, { headers })
    const sellers = await res.json()
    return NextResponse.json({ sellers: sellers || [] })
  }

  // Comments section
  if (section === 'comments') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/discussion_replies?select=id,thread_id,content,created_at,profiles(id,username,display_name)&order=created_at.desc&limit=50`, { headers })
    const comments = await res.json()
    return NextResponse.json({ comments: comments || [] })
  }

  // Reports section (placeholder — will use reports table)
  if (section === 'reports') {
    // For now return empty — reports table not yet created
    return NextResponse.json({ reports: [] })
  }

  // Announcements section
  if (section === 'announcements') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/announcements?select=*&order=created_at.desc&limit=20`, { headers })
    const announcements = await res.json()
    return NextResponse.json({ announcements: announcements || [] })
  }

  return NextResponse.json({ error: 'Unknown section' }, { status: 400 })
}

// PATCH /api/admin — all admin actions
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const { isAdmin, userId: adminId } = await isUserAdmin(token)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const body = await request.json()
  const { action } = body
  const headers = { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }

  // Update user role
  if (action === 'updateRole' && body.userId && body.role) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${body.userId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ role: body.role }),
    })
    const data = await res.json()
    // Log action
    await logAction(headers, 'update_role', adminId, { userId: body.userId, newRole: body.role })
    return NextResponse.json({ success: true, profile: data?.[0] })
  }

  // Toggle thread pin
  if (action === 'togglePin' && body.threadId) {
    const currentRes = await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?id=eq.${body.threadId}&select=is_pinned`, { headers })
    const current = await currentRes.json()
    const newPinned = !(current?.[0]?.is_pinned)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?id=eq.${body.threadId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ is_pinned: newPinned }),
    })
    const data = await res.json()
    await logAction(headers, 'toggle_pin', adminId, { threadId: body.threadId, pinned: newPinned })
    return NextResponse.json({ success: true, thread: data?.[0] })
  }

  // Delete thread + replies
  if (action === 'deleteThread' && body.threadId) {
    await fetch(`${SUPABASE_URL}/rest/v1/discussion_replies?thread_id=eq.${body.threadId}`, { method: 'DELETE', headers })
    await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?id=eq.${body.threadId}`, { method: 'DELETE', headers })
    await logAction(headers, 'delete_thread', adminId, { threadId: body.threadId })
    return NextResponse.json({ success: true })
  }

  // Delete reply
  if (action === 'deleteReply' && body.replyId) {
    await fetch(`${SUPABASE_URL}/rest/v1/discussion_replies?id=eq.${body.replyId}`, { method: 'DELETE', headers })
    await logAction(headers, 'delete_reply', adminId, { replyId: body.replyId })
    return NextResponse.json({ success: true })
  }

  // Suspend user
  if (action === 'suspendUser' && body.userId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${body.userId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ role: 'suspended' }),
    })
    const data = await res.json()
    await logAction(headers, 'suspend_user', adminId, { userId: body.userId })
    return NextResponse.json({ success: true, profile: data?.[0] })
  }

  // Reactivate user
  if (action === 'reactivateUser' && body.userId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${body.userId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ role: 'user' }),
    })
    const data = await res.json()
    await logAction(headers, 'reactivate_user', adminId, { userId: body.userId })
    return NextResponse.json({ success: true, profile: data?.[0] })
  }

  // Create announcement
  if (action === 'createAnnouncement' && body.title && body.content) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/announcements`, {
      method: 'POST', headers, body: JSON.stringify({
        title: body.title,
        content: body.content,
        priority: body.priority || 'normal',
        created_by: adminId,
      }),
    })
    const data = await res.json()
    await logAction(headers, 'create_announcement', adminId, { title: body.title })
    return NextResponse.json({ success: true, announcement: data?.[0] })
  }

  // Delete announcement
  if (action === 'deleteAnnouncement' && body.announcementId) {
    await fetch(`${SUPABASE_URL}/rest/v1/announcements?id=eq.${body.announcementId}`, { method: 'DELETE', headers })
    await logAction(headers, 'delete_announcement', adminId, { announcementId: body.announcementId })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// Helper: log admin action
async function logAction(headers: Record<string, string>, action: string, adminId: string, details: Record<string, unknown>) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/admin_audit_log`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, admin_id: adminId, details }),
    })
  } catch { /* non-critical */ }
}