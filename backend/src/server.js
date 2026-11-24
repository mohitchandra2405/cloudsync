import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createCollaborationServer } from './collaboration/server.js'
import { adminReady, adminConfigError } from './config/firebaseAdmin.js'
import { authenticate } from './middleware/authenticate.js'
import sharesRouter from './routes/shares.js'
import documentsRouter from './routes/documents.js'

const port = Number(process.env.PORT || 4000)
const databasePath = resolve(process.env.COLLAB_DATABASE || './data/collaboration.sqlite')
await mkdir(dirname(databasePath), { recursive: true })

const app = express()
app.disable('x-powered-by')
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((item) => item.trim()), credentials: false }))
app.use(express.json({ limit: '256kb' }))
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }))
app.get('/health', (_request, response) => response.json({ ok: true, service: 'cloudsync-api', firebaseAdminConfigured: adminReady }))
app.get('/api/health', (_request, response) => response.json({ ok: true, firebaseAdminConfigured: adminReady }))
app.use('/api/documents', authenticate, sharesRouter)
app.use('/api/documents', authenticate, documentsRouter)
app.use((_request, response) => response.status(404).json({ error: 'Route not found.' }))
app.use((error, _request, response, _next) => {
  const status = error.status || 500
  if (status >= 500) console.error('CloudSync request failed:', error.message)
  response.status(status).json({ error: status >= 500 ? 'The server could not complete that request.' : error.message })
})

const apiServer = app.listen(port, () => {
  console.info(`CloudSync API listening on port ${port}`)
  if (!adminReady) console.warn(`Firebase Admin is not configured: ${adminConfigError?.message || 'credentials are unavailable'}`)
})
const collaborationServer = createCollaborationServer()
await collaborationServer.listen(Number(process.env.COLLAB_PORT || 4001))

async function shutdown() {
  await collaborationServer.destroy()
  apiServer.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 5000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
