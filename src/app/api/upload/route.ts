import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })
  if (!userRes.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  const userData = await userRes.json()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP' }, { status: 400 })
    }

    // Determine bucket
    const bucketName = folder === 'seller-docs' ? 'seller-docs' : 'discussion-images'

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = `${userData.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // Upload to Supabase Storage using service role with standard POST
    const arrayBuffer = await file.arrayBuffer()

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${bucketName}/${filePath}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: Buffer.from(arrayBuffer).toString('base64'),
          contentType: file.type,
        }),
      }
    )

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      console.error('Upload failed:', uploadRes.status, err)

      // Try alternative: raw binary upload with multipart
      const formData2 = new FormData()
      const fileBlob = new Blob([arrayBuffer], { type: file.type })
      formData2.append('file', fileBlob, filePath)

      const retryRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${bucketName}/${filePath}`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: formData2,
        }
      )

      if (!retryRes.ok) {
        const retryErr = await retryRes.text()
        console.error('Upload retry failed:', retryRes.status, retryErr)
        return NextResponse.json({ error: 'Failed to upload file', details: retryErr }, { status: 500 })
      }

      const retryData = await retryRes.json()
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`
      return NextResponse.json({ url: publicUrl, path: filePath, key: retryData.Key || retryData.key })
    }

    const uploadData = await uploadRes.json()
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`
    return NextResponse.json({ url: publicUrl, path: filePath, key: uploadData.Key || uploadData.key })

  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}