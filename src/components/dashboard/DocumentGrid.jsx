import { FilePlus2, Search } from 'lucide-react'
import DocumentCard from './DocumentCard.jsx'

export default function DocumentGrid({ documents, viewMode = 'grid', loading, error, onChanged, onCreate, emptyTitle = 'No documents yet', emptyText = 'Your documents will show up here. Create one to get started.' }) {
  if (loading) return <div className="grid-skeleton" aria-label="Loading documents">{[1, 2, 3].map((item) => <div className="skeleton-card" key={item}><div /><span /><i /></div>)}</div>
  if (error) return <div className="empty-state"><span className="empty-icon">!</span><h3>Couldn’t load documents</h3><p>{error}</p></div>
  if (!documents.length) return <div className="empty-state"><span className="empty-icon"><FilePlus2 size={25} /></span><h3>{emptyTitle}</h3><p>{emptyText}</p>{onCreate && <button className="primary-button" onClick={onCreate}><FilePlus2 size={16} />Create a document</button>}</div>
  return <div className={`document-grid ${viewMode === 'list' ? 'list-view' : ''}`}>{documents.map((item) => <DocumentCard key={item.id} document={item} onChanged={onChanged} />)}</div>
}

export function SearchEmpty({ query }) { return <div className="empty-state"><span className="empty-icon"><Search size={22} /></span><h3>No matches for “{query}”</h3><p>Try another title or clear your search.</p></div> }
