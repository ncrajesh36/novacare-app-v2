import { getState, saveState } from '../lib/db.js'
import { badRequest, json, readJson, requireViewer } from '../lib/http.js'
import { sanitizeAlerts, sanitizeBalance, sanitizeReminders } from '../lib/validateState.js'

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
  if (body instanceof Response) return body
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return badRequest('Expected JSON object body')
  }

  const patch = {}

  if (body.reminders !== undefined) {
    const reminders = sanitizeReminders(body.reminders)
    if (reminders.error) return badRequest(reminders.error)
    patch.reminders = reminders.value
  }

  if (body.alerts !== undefined) {
    const alerts = sanitizeAlerts(body.alerts)
    if (alerts.error) return badRequest(alerts.error)
    patch.alerts = alerts.value
  }

  if (body.balance !== undefined) {
    const balance = sanitizeBalance(body.balance)
    if (balance.error) return badRequest(balance.error)
    patch.balance = balance.value
  }

  if (!Object.keys(patch).length) {
    return badRequest('No valid fields to update')
  }

  const state = await saveState(viewer.userId, patch, viewer.stage)
  return json(state)
}
