import { useCallback, useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import WorkspaceLayout from '../components/common/WorkspaceLayout.jsx'
import DocumentGrid from '../components/dashboard/DocumentGrid.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listDocuments } from '../services/documentService.js'

export default function RecentDocuments() {
  const { user } = useAuth(); const [documents, setDocuments] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const reload = useCallback(async () => { try { setLoading(true); setDocuments(await listDocuments(user, 'recent')) } catch (issue) { setError(issue.message) } finally { setLoading(false) } }, [user])
  useEffect(() => { reload() }, [reload])
  return <WorkspaceLayout><div className="welcome-row"><div><div className="welcome-kicker"><Clock3 size={14} />PICK UP WHERE YOU LEFT OFF</div><h1>Recent documents</h1><p>Your latest work is right at your fingertips.</p></div></div><section className="dashboard-section"><div className="section-header"><div><h2>Recently modified</h2><span className="section-subtitle">{loading ? 'Loading…' : `${documents.length} documents`}</span></div></div><DocumentGrid documents={documents} loading={loading} error={error} onChanged={reload} emptyTitle="No recent documents" emptyText="Documents you’ve opened and edited recently will show up here." /></section></WorkspaceLayout>
}
