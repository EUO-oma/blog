export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      })
    }

    const authorized = await isAuthorized(request, env)
    if (!authorized) {
      return json({ error: 'unauthorized' }, 401)
    }

    if (request.method === 'POST' && url.pathname === '/upload') {
      const filename = String(request.headers.get('x-filename') || 'file.bin')
      const contentType = String(request.headers.get('x-content-type') || 'application/octet-stream')
      const size = Number(request.headers.get('x-size') || 0)

      if (!filename) return json({ error: 'filename required' }, 400)
      if (size <= 0 || size > 10 * 1024 * 1024) return json({ error: 'invalid size (max 10MB)' }, 400)
      const isImage = /^image\/(jpeg|jpg|png|webp|gif|avif)$/i.test(contentType)
      const isAudio = /^audio\/(mpeg|mp3|mp4|x-m4a|aac|wav|webm|ogg)$/i.test(contentType)
      const isFile = /^(application|text|video)\//i.test(contentType)
      if (!isImage && !isAudio && !isFile) {
        return json({ error: 'invalid contentType' }, 400)
      }

      const ext = getExt(filename)
      const prefix = isAudio ? 'music' : isImage ? 'img' : 'files'
      const objectKey = `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`
      const body = await request.arrayBuffer()

      await env.BUCKET.put(objectKey, body, {
        httpMetadata: {
          contentType,
        },
      })

      return json({
        objectKey,
        publicUrl: `${String(env.PUBLIC_BASE_URL || '').replace(/\/$/, '')}/${objectKey}`,
      })
    }

    if (request.method === 'POST' && url.pathname === '/delete') {
      const body = await request.json().catch(() => null)
      const objectKey = String(body?.objectKey || '')
      if (!objectKey) return json({ error: 'objectKey required' }, 400)

      await env.BUCKET.delete(objectKey)
      return json({ ok: true })
    }

    return json({ error: 'not found' }, 404)
  },
}

async function isAuthorized(request, env) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) return false

  // Backward compatibility: existing static token still accepted if set
  if (env.SIGNER_TOKEN && token === String(env.SIGNER_TOKEN)) return true

  // Preferred: verify Firebase ID token via Identity Toolkit lookup
  try {
    const webApiKey = String(env.FIREBASE_WEB_API_KEY || '')
    const ownerEmail = String(env.OWNER_EMAIL || '').toLowerCase()
    if (!webApiKey || !ownerEmail) return false

    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(webApiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    })

    if (!res.ok) return false
    const data = await res.json().catch(() => null)
    const email = String(data?.users?.[0]?.email || '').toLowerCase()
    return !!email && email === ownerEmail
  } catch {
    return false
  }
}

function getExt(filename) {
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return 'bin'
  return filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-filename, x-content-type, x-size',
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      ...corsHeaders(),
    },
  })
}
