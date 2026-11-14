import {
  MAX_ALERT_TEXT,
  MAX_ALERT_TIME,
  MAX_ALERTS,
  MAX_REMINDER_LABEL,
  MAX_REMINDERS,
} from './defaults.js'

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function sanitizeReminders(reminders) {
  if (!Array.isArray(reminders)) return { error: 'reminders must be an array' }
  if (reminders.length > MAX_REMINDERS) {
    return { error: `too many reminders (max ${MAX_REMINDERS})` }
  }

  const cleaned = []
  for (const item of reminders) {
    if (!isPlainObject(item)) return { error: 'each reminder must be an object' }
    const id = Number(item.id)
    if (!Number.isFinite(id)) return { error: 'reminder id must be a number' }
    if (typeof item.label !== 'string') return { error: 'reminder label must be a string' }
    const label = item.label.trim()
    if (!label) return { error: 'reminder label is required' }
    if (label.length > MAX_REMINDER_LABEL) {
      return { error: `reminder label too long (max ${MAX_REMINDER_LABEL})` }
    }
    cleaned.push({ id, label, done: Boolean(item.done) })
  }
  return { value: cleaned }
}

export function sanitizeAlerts(alerts) {
  if (!Array.isArray(alerts)) return { error: 'alerts must be an array' }
  if (alerts.length > MAX_ALERTS) {
    return { error: `too many alerts (max ${MAX_ALERTS})` }
  }

  const cleaned = []
  for (const item of alerts) {
    if (!isPlainObject(item)) return { error: 'each alert must be an object' }
    const id = Number(item.id)
    if (!Number.isFinite(id)) return { error: 'alert id must be a number' }
    if (typeof item.text !== 'string') return { error: 'alert text must be a string' }
    const text = item.text.trim()
    if (!text) return { error: 'alert text is required' }
    if (text.length > MAX_ALERT_TEXT) {
      return { error: `alert text too long (max ${MAX_ALERT_TEXT})` }
    }
    const time =
      typeof item.time === 'string' && item.time.trim()
        ? item.time.trim().slice(0, MAX_ALERT_TIME)
        : 'just now'
    cleaned.push({ id, text, time })
  }
  return { value: cleaned }
}

export function sanitizeBalance(balance) {
  if (typeof balance !== 'number' || !Number.isFinite(balance)) {
    return { error: 'balance must be a number' }
  }
  if (balance < 0 || balance > 1_000_000) {
    return { error: 'balance out of allowed range' }
  }
  return { value: Math.round(balance * 100) / 100 }
}
