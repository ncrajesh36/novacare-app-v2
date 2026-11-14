import { getState, saveState } from '../lib/db.js'
import { badRequest, json, readJson, requireViewer } from '../lib/http.js'

export async function GET(request) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer
  const state = await getState(viewer.userId, viewer.stage)
  return json(state)
}

export async function PUT(request) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer
  const body = await readJson(request)
  if (!body || typeof body !== 'object') return badRequest('Expected JSON body')

  if (body.reminders !== undefined && !Array.isArray(body.reminders)) {
    return badRequest('reminders must be an array')
  }
  if (body.alerts !== undefined && !Array.isArray(body.alerts)) {
    return badRequest('alerts must be an array')
  }
  if (body.balance !== undefined && typeof body.balance !== 'number') {
    return badRequest('balance must be a number')
  }

  const state = await saveState(viewer.userId, body, viewer.stage)
  return json(state)
}
