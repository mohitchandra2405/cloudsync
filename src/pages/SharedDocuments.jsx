import { useCallback, useEffect, useState } from 'react'
import { UsersRound } from 'lucide-react'
import WorkspaceLayout from '../components/common/WorkspaceLayout.jsx'
import DocumentGrid from '../components/dashboard/DocumentGrid.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listDocuments } from '../services/documentService.js'

export default function SharedDocuments() {
  const { user } = useAuth(); const [documents, setDocuments] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const reload = useCallback(async () => { try { setLoading(true); setDocuments(await listDocuments(user, 'shared')) } catch (issue) { setError(issue.message) } finally { setLoading(false) } }, [user])
  useEffect(() => { reload() }, [reload])
  return <WorkspaceLayout><div className="welcome-row"><div><div className="welcome-kicker"><UsersRound size={14} />COLLABORATION</div><h1>Shared with me</h1><p>Documents your teammates have invited you to.</p></div></div><section className="dashboard-section"><div className="section-header"><div><h2>Shared documents</h2><span className="section-subtitle">{loading ? 'Loading…' : `${documents.length} documents`}</span></div></div><DocumentGrid documents={documents} loading={loading} error={error} onChanged={reload} emptyTitle="Nothing shared with you yet" emptyText="When someone invites you to a document, it will appear here." /></section></WorkspaceLayout>
}
