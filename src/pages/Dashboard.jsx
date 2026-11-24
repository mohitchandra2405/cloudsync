import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDownWideNarrow, FilePlus2, LayoutGrid, List, Sparkles } from 'lucide-react'
import WorkspaceLayout from '../components/common/WorkspaceLayout.jsx'
import DocumentGrid, { SearchEmpty } from '../components/dashboard/DocumentGrid.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { createDocument, listDocuments } from '../services/documentService.js'

const labels = { home: 'Your workspace', 'my-documents': 'My documents', starred: 'Starred documents', trash: 'Trash' }

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const view = ['my-documents', 'starred', 'trash'].includes(params.get('view')) ? params.get('view') : 'home'
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('modified')
  const [viewMode, setViewMode] = useState('grid')
  const [creating, setCreating] = useState(false)
  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true); setError('')
    try { setDocuments(await listDocuments(user, view)) } catch (issue) { setError(issue.message || 'Could not load your documents.') }
    finally { setLoading(false) }
  }, [user, view])
  useEffect(() => { reload() }, [reload])
  useEffect(() => {
    if (params.get('create') !== '1') return
    setParams((previous) => { previous.delete('create'); return previous }, { replace: true })
    void create()
  }, [params])
  const create = async () => {
    if (creating) return
    setCreating(true)
    try { const id = await createDocument(user); navigate(`/documents/${id}`) }
    catch (issue) { setError(issue.message || 'Could not create a document.') }
    finally { setCreating(false) }
  }
  const visibleDocuments = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    const filtered = documents.filter((item) => !normalized || item.title?.toLowerCase().includes(normalized) || item.ownerName?.toLowerCase().includes(normalized))
    return filtered.sort((a, b) => {
      if (sort === 'alphabetical') return (a.title || '').localeCompare(b.title || '')
      const av = a.updatedAt?.toMillis?.() || 0; const bv = b.updatedAt?.toMillis?.() || 0
      return sort === 'oldest' ? av - bv : bv - av
    })
  }, [documents, search, sort])
  const title = labels[view]
  const firstName = profile?.name?.split(' ')[0] || 'there'
  return <WorkspaceLayout showSearch search={search} setSearch={setSearch}>
    <div className="welcome-row"><div><div className="welcome-kicker"><Sparkles size={14} />YOUR TEAM WORKSPACE</div><h1>{view === 'home' ? `Good to see you, ${firstName}` : title}</h1><p>{view === 'home' ? 'Everything you’re working on, all in one place.' : view === 'trash' ? 'Deleted documents are kept here until you restore or remove them.' : 'Find and pick up where you left off.'}</p></div>{view !== 'trash' && <button className="primary-button create-button" onClick={create} disabled={creating}><FilePlus2 size={17} />{creating ? 'Creating…' : 'New document'}</button>}</div>
    <section className="dashboard-section"><div className="section-header"><div><h2>{view === 'home' ? 'Recent documents' : title}</h2><span className="section-subtitle">{loading ? 'Loading your files…' : `${visibleDocuments.length} ${visibleDocuments.length === 1 ? 'document' : 'documents'}`}</span></div><div className="view-controls"><label className="sort-select"><ArrowDownWideNarrow size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort documents"><option value="modified">Recently modified</option><option value="alphabetical">Alphabetical</option><option value="oldest">Oldest first</option></select></label><button className={`view-toggle ${viewMode === 'grid' ? 'view-selected' : ''}`} title="Grid view" aria-label="Grid view" onClick={() => setViewMode('grid')}><LayoutGrid size={17} /></button><button className={`view-toggle ${viewMode === 'list' ? 'view-selected' : ''}`} title="List view" aria-label="List view" onClick={() => setViewMode('list')}><List size={17} /></button></div></div>
      {search && !loading && visibleDocuments.length === 0 && !error ? <SearchEmpty query={search} /> : <DocumentGrid documents={visibleDocuments} viewMode={viewMode} loading={loading} error={error} onChanged={reload} onCreate={view === 'trash' ? undefined : create} emptyTitle={view === 'trash' ? 'Trash is empty' : view === 'starred' ? 'Nothing starred yet' : undefined} emptyText={view === 'trash' ? 'Documents you move to trash will appear here.' : view === 'starred' ? 'Star a document to keep it close at hand.' : undefined} />}
    </section>
    {view === 'home' && <div className="cloud-note"><div className="cloud-note-icon"><Sparkles size={17} /></div><p><b>Your work stays in sync.</b><span>Documents are saved to the cloud as you work, so they’re ready on every device.</span></p><span className="secure-label">SECURE BY DESIGN</span></div>}
  </WorkspaceLayout>
}
