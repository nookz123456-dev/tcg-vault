import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getHeaders(token?: string) {
  const h: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

// GET /api/orders — get orders for current user (buyer or seller)
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const role = searchParams.get('role') || 'buyer' // buyer or seller
  const status = searchParams.get('status')
  const userId = searchParams.get('user_id')

  if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  let query = role === 'seller' ? `seller_id=eq.${userId}` : `buyer_id=eq.${userId}`
  if (status) query += `&status=eq.${status}`

  query += `&order=created_at.desc&select=*,listing:marketplace_listings(*),buyer:profiles!orders_buyer_id_fkey(id,username,display_name),seller:profiles!orders_seller_id_fkey(id,username,display_name,seller_status)`

  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?${query}`, {
    headers: getHeaders(token),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const orders = await res.json()
  return NextResponse.json({ orders })
}

// POST /api/orders — create order (buyer places order)
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { buyer_id, seller_id, listing_id, price, currency, quantity, shipping_address, notes } = body

  if (!buyer_id || !seller_id || !listing_id || !price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Create order
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
    method: 'POST',
    headers: { ...getHeaders(token), 'Prefer': 'return=representation' },
    body: JSON.stringify({
      buyer_id,
      seller_id,
      listing_id,
      status: 'pending',
      price: parseFloat(price),
      currency: currency || 'USD',
      quantity: quantity || 1,
      shipping_address: shipping_address || null,
      notes: notes || null,
    }),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text()
    return NextResponse.json({ error: err }, { status: insertRes.status })
  }

  const order = await insertRes.json()
  return NextResponse.json({ success: true, order: order[0] })
}

// PATCH /api/orders — update order status
export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { order_id, user_id, status, notes } = body

  if (!order_id || !user_id) return NextResponse.json({ error: 'Missing order_id or user_id' }, { status: 400 })

  // Verify user is participant
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order_id}&select=buyer_id,seller_id,status`, {
    headers: getHeaders(token),
  })
  const orders = await checkRes.json()
  if (!orders.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const order = orders[0]
  if (order.buyer_id !== user_id && order.seller_id !== user_id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Status transitions
  const validTransitions: Record<string, string[]> = {
    pending: ['accepted', 'cancelled'],
    accepted: ['paid', 'cancelled'],
    paid: ['shipped', 'cancelled', 'disputed'],
    shipped: ['completed', 'disputed'],
    completed: ['disputed'],
    cancelled: [],
    disputed: [],
  }

  if (status && !validTransitions[order.status]?.includes(status)) {
    return NextResponse.json({ error: `Cannot transition from ${order.status} to ${status}` }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (notes) updates.notes = notes

  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order_id}`, {
    method: 'PATCH',
    headers: { ...getHeaders(token), 'Prefer': 'return=representation' },
    body: JSON.stringify(updates),
  })

  if (!updateRes.ok) {
    const err = await updateRes.text()
    return NextResponse.json({ error: err }, { status: updateRes.status })
  }

  const updated = await updateRes.json()
  return NextResponse.json({ success: true, order: updated[0] })
}