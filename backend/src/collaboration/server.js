import { Server } from '@hocuspocus/server'
import { SQLite } from '@hocuspocus/extension-sqlite'
import { requireAdmin } from '../config/firebaseAdmin.js'
import { getDocumentAccess } from '../services/documentAccess.js'

const allowedOrigins = new Set((process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean))
const databasePath = process.env.COLLAB_DATABASE || './data/collaboration.sqlite'
let activeServer
let persistence

export function createCollaborationServer() {
  persistence = new SQLite({ database: databasePath })
  activeServer = new Server({
    port: Number(process.env.COLLAB_PORT || 4001),
    name: 'cloudsync-collaboration',
    debounce: 1000,
    maxDebounce: 5000,
    extensions: [persistence],
    async onAuthenticate({ token, documentName, requestHeaders, connectionConfig }) {
      const origin = requestHeaders.get('origin')
      if (origin && !allowedOrigins.has(origin)) throw new Error('This origin is not allowed to connect.')
      const { auth } = requireAdmin()
      const identity = await auth.verifyIdToken(token)
      const access = await getDocumentAccess(documentName, identity.uid)
      if (!access.allowed) throw new Error(access.reason)
      connectionConfig.readOnly = access.role === 'viewer'
      return { user: { id: identity.uid, name: identity.name || identity.email || 'CloudSync user', role: access.role } }
    },
    async onTokenSync({ token, context, documentName, connection }) {
      const { auth } = requireAdmin()
      const identity = await auth.verifyIdToken(token)
      if (identity.uid !== context.user.id) throw new Error('The signed-in user changed. Reconnect to continue.')
      const access = await getDocumentAccess(documentName, identity.uid)
      if (!access.allowed) throw new Error(access.reason)
      connection.readOnly = access.role === 'viewer'
      return { refreshedAt: Date.now() }
    },
    async beforeHandleAwareness({ states, context }) {
      for (const state of states.values()) state.user = context?.user || null
    },
    onListen({ port }) { console.info(`CloudSync collaboration listening on port ${port}`) },
  })
  return activeServer
}

export async function deleteCollaborationState(documentName) {
  const instance = activeServer?.hocuspocus
  if (instance?.documents.has(documentName)) {
    instance.closeConnections(documentName)
    const deadline = Date.now() + 5000
    while (instance.documents.has(documentName) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (instance.documents.has(documentName)) throw new Error('The collaboration room did not close cleanly; stored state was retained.')
  }
  persistence?.db?.prepare('DELETE FROM documents WHERE name = ?').run(documentName)
}
