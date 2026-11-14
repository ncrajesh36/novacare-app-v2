import { addCapture, listCaptures } from '../lib/db.js'
import { badRequest, json, readJson, requireViewer } from '../lib/http.js'

export async function GET(request) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer
  const captures = await listCaptures(viewer.userId, viewer.stage)
  return json({ captures })
}

export async function POST(request) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer
  const body = await readJson(request)
  if (body instanceof Response) return body
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return badRequest('Expected JSON body')
  }

  const systolic = Number(body.systolic)
  const diastolic = Number(body.diastolic)
  if (!Number.isInteger(systolic) || !Number.isInteger(diastolic)) {
    return badRequest('systolic and diastolic must be integers')
  }
  if (systolic < 60 || systolic > 250 || diastolic < 30 || diastolic > 150) {
    return badRequest('reading out of expected range')
  }

  // Demo until a real camera/OCR path exists — always mark source as demo.
  const capture = await addCapture(
    viewer.userId,
    { systolic, diastolic, source: 'demo' },
    viewer.stage,
  )
  return json({ capture })
}
