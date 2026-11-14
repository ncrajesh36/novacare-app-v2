import { requireIdentity } from '../cursor/identity.js'
import { MAX_BODY_BYTES } from './defaults.js'

export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export function badRequest(message) {
  return json({ error: message }, 400)
}

export function payloadTooLarge(message = 'Request body too large') {
  return json({ error: message }, 413)
}

/** @returns {Promise<{ identity: object } | Response>} */
export async function requireViewer(request) {
  const identity = await requireIdentity(request)
  if (identity instanceof Response) return identity
  const userId =
    (typeof identity.sub === 'string' && identity.sub) ||
    (identity.userId != null ? `user:${identity.userId}` : '')
  if (!userId) return json({ error: 'missing_user' }, 401)
  return {
    identity,
    userId,
    stage: identity.stage === 'preview' ? 'preview' : 'production',
  }
}

/**
 * Parse JSON with a hard body-size cap.
 * @returns {Promise<object | null | Response>}
 */
export async function readJson(request, maxBytes = MAX_BODY_BYTES) {
  const declared = request.headers.get('content-length')
  if (declared != null) {
    const length = Number(declared)
    if (!Number.isFinite(length) || length < 0) return badRequest('Invalid Content-Length')
    if (length > maxBytes) return payloadTooLarge()
  }

  const buffer = await request.arrayBuffer()
  if (buffer.byteLength > maxBytes) return payloadTooLarge()
  if (buffer.byteLength === 0) return null

  try {
    return JSON.parse(new TextDecoder().decode(buffer))
  } catch {
    return null
  }
}
