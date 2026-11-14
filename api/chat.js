import { addAppointment, appendChat, listChat } from '../lib/db.js'
import { processChat } from '../lib/chatEngine.js'
import { MAX_MESSAGE_LENGTH } from '../lib/defaults.js'
import { badRequest, json, readJson, requireViewer } from '../lib/http.js'

export async function GET(request) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer
  const url = new URL(request.url)
  const sessionId = (url.searchParams.get('session_id') || 'rosa').slice(0, 64)
  const messages = await listChat(viewer.userId, sessionId, viewer.stage)
  return json({ messages, sampleData: messages.length === 0 })
}

export async function POST(request) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer
  const body = await readJson(request)
  if (body instanceof Response) return body
  if (!body || typeof body.message !== 'string') {
    return badRequest('message is required')
  }
  const message = body.message.trim()
  if (!message) return badRequest('message is required')
  if (message.length > MAX_MESSAGE_LENGTH) {
    return badRequest(`message too long (max ${MAX_MESSAGE_LENGTH})`)
  }
  const sessionId = String(body.session_id || 'rosa').slice(0, 64)

  await appendChat(viewer.userId, sessionId, 'user', message, viewer.stage)
  const result = processChat(`${viewer.stage}:${viewer.userId}:${sessionId}`, message)
  const ai = await appendChat(viewer.userId, sessionId, 'ai', result.reply, viewer.stage)

  if (result.appointment?.status === 'confirmed') {
    await addAppointment(viewer.userId, result.appointment, viewer.stage)
  }

  return json({ reply: result.reply, message: ai })
}
