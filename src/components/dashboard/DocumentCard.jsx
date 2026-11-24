import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock3, FileText, MoreHorizontal, Star, UsersRound, Trash2, RotateCcw, ExternalLink } from 'lucide-react'
import { permanentlyDeleteDocument, setDocumentDeleted, updateDocumentMetadata } from '../../services/documentService.js'
import { formatDocumentDate } from '../../utils/documentText.js'
import { notifyToast } from '../common/Feedback.jsx'

export default function DocumentCard({ document, onChanged }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const owner = document.role === 'owner'
  const run = async (action) => {
    setBusy(true)
    try { await action(); onChanged?.(); notifyToast('Document updated.') } catch (error) { notifyToast(error.message || 'Could not update this document.', 'error') }
    finally { setBusy(false); setMenuOpen(false) }
  }
  return <article className="document-card">
    <button className="card-open" onClick={() => navigate(`/documents/${document.id}`)} aria-label={`Open ${document.title}`}>
      <div className="document-preview"><div className="preview-sheet"><span /><span /><span className="preview-short" /><i /><span /><span className="preview-short" /></div><span className="file-badge"><FileText size={18} /></span></div>
      <div className="document-copy"><h3>{document.title || 'Untitled document'}</h3><p>{document.role !== 'owner' ? `Shared by ${document.ownerName || 'a teammate'}` : 'You own this document'}</p></div>
    </button>
    <div className="card-meta"><span><Clock3 size={13} />{formatDocumentDate(document.updatedAt)}</span><span className="card-state">{document.role !== 'owner' ? <><UsersRound size={13} />{document.role}</> : document.isStarred ? <Star size={13} fill="currentColor" /> : <FileText size={13} />}</span></div>
    <div className="card-actions">
      {owner && <button title={document.isStarred ? 'Remove star' : 'Add star'} disabled={busy} className={`quiet-action ${document.isStarred ? 'is-starred' : ''}`} onClick={() => run(() => updateDocumentMetadata(document.id, { isStarred: !document.isStarred }))}><Star size={16} fill={document.isStarred ? 'currentColor' : 'none'} /></button>}
      <div className="menu-wrap"><button className="quiet-action" aria-label="Document actions" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={18} /></button>
        {menuOpen && <div className="action-menu">
          <button onClick={() => navigate(`/documents/${document.id}`)}><ExternalLink size={14} />Open document</button>
          {document.isDeleted && owner ? <><button onClick={() => run(() => setDocumentDeleted(document.id, false))}><RotateCcw size={14} />Restore</button><button className="danger-text" onClick={() => window.confirm('Permanently delete this document? This cannot be undone.') && run(() => permanentlyDeleteDocument(document.id))}><Trash2 size={14} />Delete permanently</button></> : !document.isDeleted && owner && <button className="danger-text" onClick={() => run(() => setDocumentDeleted(document.id, true))}><Trash2 size={14} />Move to trash</button>}
        </div>}
      </div>
    </div>
  </article>
}
