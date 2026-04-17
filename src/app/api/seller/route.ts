import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.split(' ')[1]
}

async function isUserAdmin(token: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) return false
  const userData = await res.json()
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}&select=role`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
  })
  const profiles = await profileRes.json()
  return profiles?.[0]?.role === 'admin'
}

// GET /api/seller — get seller profile or list pending (admin)
export async function GET(request: NextRequest) {
  const token = getAuthUser(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  const headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  }

  // Admin: list pending verifications
  if (action === 'pending') {
    const isAdmin = await isUserAdmin(token)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const res = await fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?select=*,profiles(id,username,display_name,email)&status=eq.pending&order=created_at.asc`, { headers })
    const data = await res.json()
    return NextResponse.json({ sellers: data })
  }

  // Admin: list all sellers
  if (action === 'all') {
    const isAdmin = await isUserAdmin(token)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const res = await fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?select=*,profiles(id,username,display_name)&order=created_at.desc`, { headers })
    const data = await res.json()
    return NextResponse.json({ sellers: data })
  }

  // Get specific seller profile
  const sellerId = url.searchParams.get('sellerId')
  if (sellerId) {
    // Public: only show verified sellers
    const res = await fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?id=eq.${sellerId}&select=*,profiles(id,username,display_name,seller_rating_avg,seller_rating_count)`, { headers })
    const data = await res.json()
    if (!data.length) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    // Hide sensitive info for non-owners
    const seller = data[0]
    return NextResponse.json({ seller })
  }

  // Get own seller profile
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${token}` },
  })
  const userData = await userRes.json()
  if (!userData.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?id=eq.${userData.id}&select=*`, { headers })
  const data = await res.json()
  return NextResponse.json({ seller: data[0] || null })
}

// POST /api/seller — apply to become a seller
export async function POST(request: NextRequest) {
  const token = getAuthUser(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${token}` },
  })
  const userData = await userRes.json()
  if (!userData.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    real_name, date_of_birth, national_id,
    phone, address, district, city, province, postal_code,
    id_card_image_url, selfie_with_id_url,
    shop_name, shop_description, line_id,
  } = body

  // Validate required fields
  if (!real_name || !date_of_birth || !national_id || !phone || !address || !district || !city || !province || !postal_code) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate Thai national ID format (13 digits)
  if (!/^\d{13}$/.test(national_id)) {
    return NextResponse.json({ error: 'National ID must be 13 digits' }, { status: 400 })
  }

  // Validate phone format
  if (!/^0\d{8,9}$/.test(phone.replace(/[-\s]/g, ''))) {
    return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
  }

  // Check if already applied
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?id=eq.${userData.id}&select=status`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
  })
  const existing = await checkRes.json()
  if (existing.length > 0) {
    if (existing[0].status === 'pending') {
      return NextResponse.json({ error: 'You have already applied. Please wait for verification.' }, { status: 409 })
    }
    if (existing[0].status === 'verified') {
      return NextResponse.json({ error: 'You are already a verified seller.' }, { status: 409 })
    }
    if (existing[0].status === 'suspended') {
      return NextResponse.json({ error: 'Your seller account has been suspended.' }, { status: 403 })
    }
    // Rejected → can re-apply by updating
  }

  const adminHeaders = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }

  const sellerData = {
    id: userData.id,
    status: 'pending',
    real_name,
    date_of_birth,
    national_id,
    phone,
    address,
    district,
    city,
    province,
    postal_code,
    country: 'Thailand',
    id_card_image_url: id_card_image_url || null,
    selfie_with_id_url: selfie_with_id_url || null,
    shop_name: shop_name || null,
    shop_description: shop_description || null,
    line_id: line_id || null,
  }

  // Insert or update (if previously rejected)
  const method = existing.length > 0 ? 'PATCH' : 'POST'
  const url = existing.length > 0
    ? `${SUPABASE_URL}/rest/v1/seller_profiles?id=eq.${userData.id}`
    : `${SUPABASE_URL}/rest/v1/seller_profiles`

  const res = await fetch(url, {
    method,
    headers: adminHeaders,
    body: JSON.stringify(sellerData),
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: data.message || 'Failed to submit application' }, { status: 500 })
  }

  // Update profile seller_status
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ seller_status: 'pending' }),
  })

  return NextResponse.json({ success: true, seller: data[0] || data })
}

// PATCH /api/seller — admin: approve/reject/suspend seller
export async function PATCH(request: NextRequest) {
  const token = getAuthUser(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = await isUserAdmin(token)
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })

  const body = await request.json()
  const { sellerId, action, rejectionReason } = body

  if (!sellerId || !action) {
    return NextResponse.json({ error: 'Missing sellerId or action' }, { status: 400 })
  }

  const validActions = ['approve', 'reject', 'suspend', 'reactivate']
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const statusMap: Record<string, string> = {
    approve: 'verified',
    reject: 'rejected',
    suspend: 'suspended',
    reactivate: 'verified',
  }

  const adminHeaders = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }

  // Get admin user id
  const adminRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${token}` },
  })
  const adminData = await adminRes.json()

  const updateData: Record<string, unknown> = {
    status: statusMap[action],
    verified_by: adminData.id,
    verified_at: new Date().toISOString(),
  }
  if (action === 'reject') updateData.rejection_reason = rejectionReason || null
  if (action === 'approve') updateData.rejection_reason = null

  // Update seller profile
  await fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?id=eq.${sellerId}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify(updateData),
  })

  // Update profile seller_status
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${sellerId}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ seller_status: statusMap[action] }),
  })

  return NextResponse.json({ success: true, status: statusMap[action] })
}