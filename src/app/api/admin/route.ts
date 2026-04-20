import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function checkEnv() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { ok: false, missing: [!SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL', !SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean) }
  }
  return { ok: true, missing: [] }
}

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
  const envCheck = checkEnv()
  if (!envCheck.ok) {
    return NextResponse.json({ error: `Missing env vars: ${envCheck.missing.join(', ')}` }, { status: 500 })
  }

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

  // Overview stats — enhanced with marketplace + signup trend
  if (section === 'overview') {
    try {
    const [usersRes, threadsRes, commentsRes, sellersRes, tradesRes, listingsRes, ordersRes, disputedRes, signupWeekRes, signupTodayRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,created_at`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?select=id`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/discussion_replies?select=id`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?select=id,status`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/trade_offers?select=id,status`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/marketplace_listings?select=id`, { headers }).catch(() => null),
      fetch(`${SUPABASE_URL}/rest/v1/orders?select=id,status`, { headers }).catch(() => null),
      fetch(`${SUPABASE_URL}/rest/v1/orders?status=eq.disputed&select=id`, { headers }).catch(() => null),
      // Users created in last 7 days
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=created_at&created_at=gte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}&order=created_at.asc`, { headers }),
      // Users created today
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&created_at=gte.${new Date(new Date().setHours(0, 0, 0, 0)).toISOString()}`, { headers }),
    ])

    const allUsers: any[] = (await usersRes.json()) || []
    const totalUsers = allUsers.length
    const totalThreads = (await threadsRes.json())?.length || 0
    const totalComments = (await commentsRes.json())?.length || 0
    const sellers: any[] = (await sellersRes.json()) || []
    const trades: any[] = (await tradesRes.json()) || []
    const listingsData = listingsRes ? (await listingsRes.json()) : []
    const totalListings = Array.isArray(listingsData) ? listingsData.length : 0
    const ordersData = ordersRes ? (await ordersRes.json()) : []
    const totalOrders = Array.isArray(ordersData) ? ordersData.length : 0
    const disputedData = disputedRes ? (await disputedRes.json()) : []
    const disputedOrders = Array.isArray(disputedData) ? disputedData.length : 0
    const newUsersToday = (await signupTodayRes.json())?.length || 0

    // Calculate signup trend (7 days grouped by date)
    const weekUsers: any[] = (await signupWeekRes.json()) || []
    const signupTrend: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().slice(0, 10)
      const count = weekUsers.filter((u: any) => u.created_at?.slice(0, 10) === dateStr).length
      signupTrend.push({ date: dateStr, count })
    }

    const newUsersThisWeek = weekUsers.length
    const pendingSellers = sellers.filter(s => s.status === 'pending').length
    const verifiedSellers = sellers.filter(s => s.status === 'verified').length
    const completedTrades = trades.filter((t: any) => t.status === 'completed').length

    // Recent items
    const [recentUsersRes, recentThreadsRes, recentActivitiesRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,username,display_name,role,created_at&order=created_at.desc&limit=10`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?select=id,title,is_pinned,created_at&order=created_at.desc&limit=10`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/admin_audit_log?select=*&order=created_at.desc&limit=10`, { headers }).catch(() => ({ json: async () => [] } as any)),
    ])
    const recentUsers = await recentUsersRes.json()
    const recentThreads = await recentThreadsRes.json()
    const recentActivitiesRaw = await (recentActivitiesRes as any).json?.() ?? await (recentActivitiesRes as any).json()
    const recentActivities = Array.isArray(recentActivitiesRaw) ? recentActivitiesRaw : []

    return NextResponse.json({
      stats: { totalUsers, totalThreads, totalComments, pendingSellers, verifiedSellers, completedTrades, totalListings, totalOrders, disputedOrders, newUsersToday, newUsersThisWeek },
      recentUsers: recentUsers || [],
      recentThreads: recentThreads || [],
      recentActivities,
      signupTrend,
    })
    } catch (err: any) {
      return NextResponse.json({ error: 'Overview failed: ' + (err.message || String(err)), stack: err.stack?.slice(0, 200) }, { status: 500 })
    }
  }

  // Users section — enhanced with email + ban_reason
  if (section === 'users') {
    const search = url.searchParams.get('search') || ''
    let query = 'select=id,username,display_name,role,created_at,seller_status,ban_reason&order=created_at.desc&limit=50'
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

  // Announcements section
  if (section === 'announcements') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/announcements?select=*&order=created_at.desc&limit=20`, { headers })
    const announcements = await res.json()
    return NextResponse.json({ announcements: announcements || [] })
  }

  // Disputed orders
  if (section === 'disputed-orders') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?status=eq.disputed&select=*,listing:marketplace_listings(card_name),buyer:profiles!orders_buyer_id_fkey(id,username,display_name),seller:profiles!orders_seller_id_fkey(id,username,display_name)&order=created_at.desc&limit=50`, { headers })
    const orders = await res.json()
    return NextResponse.json({ orders: orders || [] })
  }

  // All listings
  if (section === 'all-listings') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/marketplace_listings?select=id,seller_id,game,card_id,card_name,condition,price,currency,is_active,created_at,seller:profiles!marketplace_listings_seller_id_fkey(id,username,display_name)&order=created_at.desc&limit=50`, { headers })
    const listings = await res.json()
    return NextResponse.json({ listings: listings || [] })
  }

  // Export users CSV
  if (section === 'export-users') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,username,display_name,email,role,seller_status,created_at&limit=1000`, { headers })
    const users: any[] = (await res.json()) || []
    const csv = 'id,username,display_name,email,role,seller_status,created_at\n' +
      users.map(u => `"${u.id}","${u.username}","${u.display_name || ''}","${u.email || ''}","${u.role}","${u.seller_status || ''}","${u.created_at}"`).join('\n')
    return NextResponse.json({ csv })
  }

  // Export orders CSV
  if (section === 'export-orders') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,listing:marketplace_listings(card_name),buyer:profiles!orders_buyer_id_fkey(username),seller:profiles!orders_seller_id_fkey(username)&limit=1000`, { headers })
    const orders: any[] = (await res.json()) || []
    const csv = 'id,buyer,seller,card_name,price,currency,status,created_at\n' +
      orders.map(o => `"${o.id}","${o.buyer?.username || ''}","${o.seller?.username || ''}","${o.listing?.card_name || ''}","${o.price}","${o.currency}","${o.status}","${o.created_at}"`).join('\n')
    return NextResponse.json({ csv })
  }

  // Export listings CSV
  if (section === 'export-listings') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/marketplace_listings?select=id,seller:profiles!marketplace_listings_seller_id_fkey(username),game,card_id,card_name,condition,price,currency,is_active,created_at&limit=1000`, { headers })
    const listings: any[] = (await res.json()) || []
    const csv = 'id,seller,game,card_id,card_name,condition,price,currency,is_active,created_at\n' +
      listings.map(l => `"${l.id}","${l.seller?.username || ''}","${l.game}","${l.card_id}","${l.card_name}","${l.condition}","${l.price}","${l.currency}","${l.is_active}","${l.created_at}"`).join('\n')
    return NextResponse.json({ csv })
  }

  return NextResponse.json({ error: 'Unknown section' }, { status: 400 })
}

// PATCH /api/admin — all admin actions
export async function PATCH(request: NextRequest) {
  const envCheck = checkEnv()
  if (!envCheck.ok) {
    return NextResponse.json({ error: `Missing env vars: ${envCheck.missing.join(', ')}` }, { status: 500 })
  }

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
    await logAction(headers, 'update_role', adminId, { userId: body.userId, newRole: body.role })
    return NextResponse.json({ success: true, profile: data?.[0] })
  }

  // Suspend user — with ban_reason
  if (action === 'suspendUser' && body.userId) {
    const patchData: Record<string, unknown> = { role: 'suspended' }
    if (body.ban_reason) patchData.ban_reason = body.ban_reason
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${body.userId}`, {
      method: 'PATCH', headers, body: JSON.stringify(patchData),
    })
    const data = await res.json()
    await logAction(headers, 'suspend_user', adminId, { userId: body.userId, ban_reason: body.ban_reason })
    return NextResponse.json({ success: true, profile: data?.[0] })
  }

  // Reactivate user — clear ban_reason
  if (action === 'reactivateUser' && body.userId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${body.userId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ role: 'user', ban_reason: null }),
    })
    const data = await res.json()
    await logAction(headers, 'reactivate_user', adminId, { userId: body.userId })
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

  // Create announcement
  if (action === 'createAnnouncement' && body.title && body.content) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/announcements`, {
      method: 'POST', headers, body: JSON.stringify({
        title: body.title, content: body.content, priority: body.priority || 'normal', created_by: adminId,
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

  // Approve seller
  if (action === 'approveSeller' && body.sellerId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?id=eq.${body.sellerId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ status: 'verified' }),
    })
    const data = await res.json()
    // Also update profile seller_status
    if (data?.[0]?.profile_id) {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${data[0].profile_id}`, {
        method: 'PATCH', headers, body: JSON.stringify({ seller_status: 'verified' }),
      })
    }
    await logAction(headers, 'approve_seller', adminId, { sellerId: body.sellerId })
    return NextResponse.json({ success: true, seller: data?.[0] })
  }

  // Reject seller
  if (action === 'rejectSeller' && body.sellerId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?id=eq.${body.sellerId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ status: 'rejected', rejection_reason: body.reason || null }),
    })
    const data = await res.json()
    if (data?.[0]?.profile_id) {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${data[0].profile_id}`, {
        method: 'PATCH', headers, body: JSON.stringify({ seller_status: 'rejected' }),
      })
    }
    await logAction(headers, 'reject_seller', adminId, { sellerId: body.sellerId, reason: body.reason })
    return NextResponse.json({ success: true, seller: data?.[0] })
  }

  // Resolve disputed order
  if (action === 'resolveOrder' && body.orderId && body.resolution) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${body.orderId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ status: body.resolution }),
    })
    const data = await res.json()
    await logAction(headers, 'resolve_order', adminId, { orderId: body.orderId, resolution: body.resolution })
    return NextResponse.json({ success: true, order: data?.[0] })
  }

  // Toggle listing active/inactive
  if (action === 'toggleListing' && body.listingId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/marketplace_listings?id=eq.${body.listingId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ is_active: body.isActive }),
    })
    const data = await res.json()
    await logAction(headers, 'toggle_listing', adminId, { listingId: body.listingId, isActive: body.isActive })
    return NextResponse.json({ success: true, listing: data?.[0] })
  }

  // Delete listing
  if (action === 'deleteListing' && body.listingId) {
    await fetch(`${SUPABASE_URL}/rest/v1/marketplace_listings?id=eq.${body.listingId}`, { method: 'DELETE', headers })
    await logAction(headers, 'delete_listing', adminId, { listingId: body.listingId })
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