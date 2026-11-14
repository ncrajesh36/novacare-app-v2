import { requireIdentity } from '../cursor/identity.js'

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

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
