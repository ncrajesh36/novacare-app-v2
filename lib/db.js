import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import {
  DEFAULT_ALERTS,
  DEFAULT_BALANCE,
  DEFAULT_REMINDERS,
  MAX_ALERTS,
  MAX_CHAT_HISTORY,
} from './defaults.js'

const { Pool } = pg

const memory = {
  state: new Map(),
  chats: new Map(),
  captures: new Map(),
  appointments: new Map(),
  nextId: 1,
}

function nextMemoryId() {
  memory.nextId += 1
  return memory.nextId
}

let pool = null
let schemaReady = false

function databaseUrl() {
  const url = process.env.DATABASE_URL
  return typeof url === 'string' && url.trim() ? url.trim() : ''
}

export function usingDatabase() {
  return Boolean(databaseUrl())
}

function getPool() {
  if (!usingDatabase()) return null
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl(),
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }
  return pool
}

async function ensureSchema() {
  const p = getPool()
  if (!p || schemaReady) return p
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const sqlPath = path.join(root, 'migrations', '001_init.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')
  await p.query(sql)
  schemaReady = true
  return p
}

function memoryKey(userId, stage) {
  return `${stage}:${userId}`
}

function defaultState() {
  return {
    reminders: structuredClone(DEFAULT_REMINDERS),
    alerts: structuredClone(DEFAULT_ALERTS),
    balance: DEFAULT_BALANCE,
    sampleData: !usingDatabase(),
  }
}

export async function getState(userId, stage = 'production') {
  const p = await ensureSchema()
  if (!p) {
    const key = memoryKey(userId, stage)
    if (!memory.state.has(key)) memory.state.set(key, defaultState())
    return { ...memory.state.get(key), sampleData: true }
  }

  const { rows } = await p.query(
    `SELECT reminders, alerts, balance::float8 AS balance
     FROM app_state WHERE user_id = $1`,
    [userId],
  )
  if (!rows.length) {
    const seeded = defaultState()
    await p.query(
      `INSERT INTO app_state (user_id, reminders, alerts, balance)
       VALUES ($1, $2::jsonb, $3::jsonb, $4)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, JSON.stringify(seeded.reminders), JSON.stringify(seeded.alerts), seeded.balance],
    )
    return { ...seeded, sampleData: false }
  }
  return {
    reminders: rows[0].reminders,
    alerts: rows[0].alerts,
    balance: Number(rows[0].balance),
    sampleData: false,
  }
}

export async function saveState(userId, patch, stage = 'production') {
  const current = await getState(userId, stage)
  const next = {
    reminders: Array.isArray(patch.reminders) ? patch.reminders : current.reminders,
    alerts: Array.isArray(patch.alerts) ? patch.alerts.slice(0, MAX_ALERTS) : current.alerts,
    balance:
      typeof patch.balance === 'number' && Number.isFinite(patch.balance)
        ? patch.balance
        : current.balance,
  }

  const p = await ensureSchema()
  if (!p) {
    memory.state.set(memoryKey(userId, stage), { ...next, sampleData: true })
    return { ...next, sampleData: true }
  }

  await p.query(
    `INSERT INTO app_state (user_id, reminders, alerts, balance, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       reminders = EXCLUDED.reminders,
       alerts = EXCLUDED.alerts,
       balance = EXCLUDED.balance,
       updated_at = NOW()`,
    [userId, JSON.stringify(next.reminders), JSON.stringify(next.alerts), next.balance],
  )
  return { ...next, sampleData: false }
}

export async function listChat(userId, sessionId = 'rosa', stage = 'production') {
  const p = await ensureSchema()
  if (!p) {
    const key = memoryKey(`${userId}:${sessionId}`, stage)
    return memory.chats.get(key) ?? []
  }
  const { rows } = await p.query(
    `SELECT id, role, text, created_at
     FROM chat_messages
     WHERE user_id = $1 AND session_id = $2
     ORDER BY created_at ASC, id ASC
     LIMIT $3`,
    [userId, sessionId, MAX_CHAT_HISTORY],
  )
  return rows.map((r) => ({
    id: Number(r.id),
    from: r.role === 'user' ? 'user' : 'ai',
    text: r.text,
    createdAt: r.created_at,
  }))
}

export async function appendChat(userId, sessionId, role, text, stage = 'production') {
  const p = await ensureSchema()
  if (!p) {
    const key = memoryKey(`${userId}:${sessionId}`, stage)
    const list = memory.chats.get(key) ?? []
    const row = {
      id: nextMemoryId(),
      from: role === 'user' ? 'user' : 'ai',
      text,
      createdAt: new Date().toISOString(),
    }
    list.push(row)
    memory.chats.set(key, list.slice(-MAX_CHAT_HISTORY))
    return row
  }
  const { rows } = await p.query(
    `INSERT INTO chat_messages (user_id, session_id, role, text)
     VALUES ($1, $2, $3, $4)
     RETURNING id, role, text, created_at`,
    [userId, sessionId, role, text],
  )
  return {
    id: Number(rows[0].id),
    from: rows[0].role === 'user' ? 'user' : 'ai',
    text: rows[0].text,
    createdAt: rows[0].created_at,
  }
}

export async function addCapture(userId, { systolic, diastolic, source = 'demo' }, stage = 'production') {
  const p = await ensureSchema()
  if (!p) {
    const key = memoryKey(userId, stage)
    const list = memory.captures.get(key) ?? []
    const row = {
      id: nextMemoryId(),
      systolic,
      diastolic,
      source,
      createdAt: new Date().toISOString(),
    }
    list.unshift(row)
    memory.captures.set(key, list.slice(0, 100))
    return row
  }
  const { rows } = await p.query(
    `INSERT INTO captures (user_id, systolic, diastolic, source)
     VALUES ($1, $2, $3, $4)
     RETURNING id, systolic, diastolic, source, created_at`,
    [userId, systolic, diastolic, source],
  )
  return {
    id: Number(rows[0].id),
    systolic: rows[0].systolic,
    diastolic: rows[0].diastolic,
    source: rows[0].source,
    createdAt: rows[0].created_at,
  }
}

export async function listCaptures(userId, stage = 'production') {
  const p = await ensureSchema()
  if (!p) {
    return memory.captures.get(memoryKey(userId, stage)) ?? []
  }
  const { rows } = await p.query(
    `SELECT id, systolic, diastolic, source, created_at
     FROM captures WHERE user_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 100`,
    [userId],
  )
  return rows.map((r) => ({
    id: Number(r.id),
    systolic: r.systolic,
    diastolic: r.diastolic,
    source: r.source,
    createdAt: r.created_at,
  }))
}

export async function addAppointment(userId, { symptoms, doctor, status = 'confirmed' }, stage = 'production') {
  const p = await ensureSchema()
  if (!p) {
    const key = memoryKey(userId, stage)
    const list = memory.appointments.get(key) ?? []
    const row = {
      id: nextMemoryId(),
      symptoms,
      doctor,
      status,
      createdAt: new Date().toISOString(),
    }
    list.unshift(row)
    memory.appointments.set(key, list.slice(0, 100))
    return row
  }
  const { rows } = await p.query(
    `INSERT INTO appointments (user_id, symptoms, doctor, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id, symptoms, doctor, status, created_at`,
    [userId, symptoms, doctor, status],
  )
  return {
    id: Number(rows[0].id),
    symptoms: rows[0].symptoms,
    doctor: rows[0].doctor,
    status: rows[0].status,
    createdAt: rows[0].created_at,
  }
}
