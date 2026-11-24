import { useEffect, useState } from 'react'
import { Copy, Link2, LoaderCircle, Mail, ShieldCheck, UserRoundPlus, X } from 'lucide-react'
import { apiRequest } from '../../services/api.js'

export default function ShareDialog({ documentId, title, onClose }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadShares = async () => {
    try { const result = await apiRequest(`/api/documents/${documentId}/shares`); setShares(result.shares || []) }
    catch (issue) { setError(issue.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { loadShares() }, [documentId])

  const addShare = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { await apiRequest(`/api/documents/${documentId}/shares`, { method: 'POST', body: JSON.stringify({ email, role }) }); setMessage(`Shared with ${email.trim()}.`); setEmail(''); await loadShares() }
    catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  const changeRole = async (uid, nextRole) => {
    setBusy(true); setError('')
    try { await apiRequest(`/api/documents/${documentId}/shares/${uid}`, { method: 'PATCH', body: JSON.stringify({ role: nextRole }) }); await loadShares() }
    catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  const removeShare = async (uid) => {
    setBusy(true); setError('')
    try { await apiRequest(`/api/documents/${documentId}/shares/${uid}`, { method: 'DELETE' }); await loadShares() }
    catch (issue) { setError(issue.message) }
    finally { setBusy(false) }
  }
  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/documents/${documentId}`)
    setMessage('Document link copied. Only invited people can open it.')
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-heading">
      <div className="modal-heading"><div><span className="modal-icon"><UsersRoundIcon /></span><h2 id="share-heading">Share document</h2><p>{title}</p></div><button className="icon-button" onClick={onClose} aria-label="Close sharing"><X size={19} /></button></div>
      <form className="share-form" onSubmit={addShare}><label htmlFor="share-email">Add people by email</label><div className="share-input-row"><div className="email-input"><Mail size={16} /><input id="share-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></div><select aria-label="Permission" value={role} onChange={(event) => setRole(event.target.value)}><option value="editor">Editor</option><option value="viewer">Viewer</option></select><button type="submit" className="primary-button compact" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <UserRoundPlus size={15} />}Share</button></div></form>
      {error && <p className="inline-error">{error}</p>}{message && <p className="inline-success">{message}</p>}
      <div className="share-people"><div className="section-mini-title"><span>People with access</span><span>{shares.length + 1}</span></div><div className="share-person"><span className="avatar avatar-small owner-avatar">Y</span><span className="share-person-copy"><b>You</b><small>Owner</small></span><span className="role-pill"><ShieldCheck size={13} />Owner</span></div>
        {loading ? <p className="muted-line">Loading people…</p> : shares.map((person) => <div className="share-person" key={person.userId}><span className="avatar avatar-small">{(person.name || person.email || 'U')[0].toUpperCase()}</span><span className="share-person-copy"><b>{person.name || person.email}</b><small>{person.email}</small></span><select className="role-select" value={person.role} disabled={busy} aria-label={`Permission for ${person.email}`} onChange={(event) => changeRole(person.userId, event.target.value)}><option value="editor">Editor</option><option value="viewer">Viewer</option></select><button className="remove-access" disabled={busy} onClick={() => removeShare(person.userId)} aria-label={`Remove ${person.email}`}>Remove</button></div>)}
        {!loading && shares.length === 0 && <p className="muted-line">No one else has access yet.</p>}
      </div>
      <div className="link-access"><span className="link-access-icon"><Link2 size={16} /></span><span><b>Restricted access</b><small>Only invited people can open this document</small></span><button className="quiet-action" onClick={copyLink} title="Copy document link"><Copy size={16} /></button></div>
    </section>
  </div>
}

function UsersRoundIcon() { return <UserRoundPlus size={18} /> }
