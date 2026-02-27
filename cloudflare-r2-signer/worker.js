export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      })
    }

    if (!isAuthorized(request, env)) {
      return json({ error: 'unauthorized' }, 401)
    }

    if (request.method === 'POST' && url.pathname === '/sign') {
      const body = await request.json().catch(() => null)
      const filename = String(body?.filename || 'file.bin')
      const contentType = String(body?.contentType || 'application/octet-stream')
      const size = Number(body?.size || 0)

      if (!filename) return json({ error: 'filename required' }, 400)
      if (size <= 0 || size > 10 * 1024 * 1024) return json({ error: 'invalid size (max 10MB)' }, 400)
      if (!/^image\/(jpeg|jpg|png|webp|gif|avif)$/i.test(contentType)) {
        return json({ error: 'invalid contentType' }, 400)
      }

      const ext = getExt(filename)
      const objectKey = `img/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`

      const signedUrl = await env.BUCKET.createPresignedUrl({
        method: 'PUT',
        key: objectKey,
        expiration: 60 * 5,
      })

      return json({
        signedUrl,
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

function isAuthorized(request, env) {
  const auth = request.headers.get('authorization') || ''
  return auth === `Bearer ${env.SIGNER_TOKEN}`
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
