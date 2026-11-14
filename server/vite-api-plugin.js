import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROUTES = {
  '/api/state': '../api/state.js',
  '/api/chat': '../api/chat.js',
  '/api/captures': '../api/captures.js',
}

async function toWebRequest(req, url) {
  const host = req.headers.host || '127.0.0.1'
  const origin = `http://${host}`
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v))
    else headers.set(key, value)
  }

  const method = req.method || 'GET'
  const init = { method, headers }
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    init.body = Buffer.concat(chunks)
  }
  return new Request(new URL(url, origin), init)
}

async function writeWebResponse(res, response) {
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return
    res.setHeader(key, value)
  })
  const buf = Buffer.from(await response.arrayBuffer())
  res.end(buf)
}

export function viteApiPlugin() {
  return {
    name: 'novacare-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = req.url || '/'
          const pathname = url.split('?')[0]
          const rel = ROUTES[pathname]
          if (!rel) return next()

          const modFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), rel)
          const mod = await server.ssrLoadModule(pathToFileURL(modFile).href)
          const method = (req.method || 'GET').toUpperCase()
          const handler = mod[method]
          if (typeof handler !== 'function') {
            res.statusCode = 405
            res.end('Method Not Allowed')
            return
          }
          const request = await toWebRequest(req, url)
          const response = await handler(request)
          await writeWebResponse(res, response)
        } catch (err) {
          console.error('[novacare-api]', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'internal_error' }))
        }
      })
    },
  }
}
