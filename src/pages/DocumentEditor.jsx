import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import LinkExtension from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { Cloud, ArrowLeft, Bold, Check, ChevronDown, CircleAlert, Clock3, Code2, Download, FileDown, FilePlus2, Heading1, Heading2, Highlighter, ImagePlus, Italic, Link2, List, ListOrdered, LoaderCircle, MoreHorizontal, Quote, Redo2, Share2, Strikethrough, Table2, Underline as UnderlineIcon, Undo2, UsersRound, AlignCenter, AlignLeft, AlignRight, Eye, Save, Palette, RotateCcw, X } from 'lucide-react'
import { auth } from '../services/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getDocument, listVersions, addVersion, renameDocument, updateDocumentMetadata } from '../services/documentService.js'
import { uploadDocumentImage } from '../services/storageService.js'
import { LoadingScreen } from '../components/common/Feedback.jsx'
import ShareDialog from '../components/sharing/ShareDialog.jsx'
import { flattenDocumentText, sanitizeFileName } from '../utils/documentText.js'

const COLORS = ['#25304a', '#5268e8', '#15a68a', '#df8d38', '#d85672', '#9059c9']
const collabUrl = import.meta.env.VITE_COLLAB_URL || 'ws://localhost:4000'
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]

export default function DocumentEditor() {
  const { documentId } = useParams(); const { user, profile } = useAuth(); const navigate = useNavigate()
  const [docData, setDocData] = useState(null); const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState('')
  const [provider, setProvider] = useState(null); const [connection, setConnection] = useState('connecting'); const [saveStatus, setSaveStatus] = useState('saved')
  const [title, setTitle] = useState(''); const [editingTitle, setEditingTitle] = useState(false); const titleInput = useRef(null)
  const [shareOpen, setShareOpen] = useState(false); const [versionsOpen, setVersionsOpen] = useState(false); const [versions, setVersions] = useState([]); const [versionsLoading, setVersionsLoading] = useState(false)
  const [collaborators, setCollaborators] = useState([]); const [message, setMessage] = useState(''); const [issue, setIssue] = useState(''); const imageInput = useRef(null); const saveTimer = useRef(null); const versionTimer = useRef(null)
  const editable = docData?.role === 'owner' || docData?.role === 'editor'

  useEffect(() => {
    let active = true
    getDocument(documentId, user.uid).then((data) => {
      if (!active) return
      if (!data) setLoadError('This document does not exist, or you do not have permission to open it.')
      else { setDocData(data); setTitle(data.title || 'Untitled document') }
    }).catch((error) => setLoadError(error.message || 'The document could not be loaded.')).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [documentId, user.uid])

  useEffect(() => {
    if (!docData) return undefined
    let alive = true
    const nextProvider = new HocuspocusProvider({
      url: collabUrl, name: documentId, token: () => auth.currentUser.getIdToken(),
      onStatus: ({ status }) => alive && setConnection(status),
      onSynced: ({ state }) => alive && state && setConnection('connected'),
      onAwarenessUpdate: ({ states }) => alive && setCollaborators(states.map((state) => state.user).filter((person) => person?.id !== user.uid)),
    })
    setProvider(nextProvider)
    return () => { alive = false; nextProvider.destroy(); setProvider(null) }
  }, [docData, documentId, user.uid])

  const userColor = useMemo(randomColor, [user.uid])
  const editor = useEditor({
    extensions: provider ? [
      StarterKit.configure({ undoRedo: false }), Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }), TextStyle, Color,
      Highlight.configure({ multicolor: true }),
      LinkExtension.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Image.configure({ allowBase64: false, inline: false }),
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
      Collaboration.configure({ document: provider.document }),
      CollaborationCaret.configure({ provider, user: { id: user.uid, name: profile?.name || user.email, color: userColor } }),
    ] : [StarterKit],
    editable: Boolean(provider && editable),
    immediatelyRender: false,
    onUpdate: () => {
      if (!editable) return
      setSaveStatus('saving')
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        try { await updateDocumentMetadata(documentId, { updatedBy: user.uid }); setSaveStatus('saved') }
        catch (error) { setSaveStatus('error'); setIssue(`Cloud save failed: ${error.message}`) }
      }, 850)
      clearTimeout(versionTimer.current)
      versionTimer.current = setTimeout(async () => {
        try { if (editor && editor.getText().trim()) await addVersion(documentId, editor.getJSON(), user) }
        catch (error) { console.warn('Automatic version snapshot failed', error) }
      }, 120_000)
    },
  }, [provider, editable, documentId, user.uid, profile?.name, user.email, userColor])

  useEffect(() => () => { clearTimeout(saveTimer.current); clearTimeout(versionTimer.current) }, [])
  useEffect(() => { if (editingTitle) titleInput.current?.focus() }, [editingTitle])

  const refreshVersions = useCallback(async () => {
    setVersionsLoading(true)
    try { setVersions(await listVersions(documentId)) } catch (error) { setIssue(error.message) }
    finally { setVersionsLoading(false) }
  }, [documentId])

  const saveTitle = async () => {
    const nextTitle = title.trim() || 'Untitled document'
    setTitle(nextTitle); setEditingTitle(false)
    if (nextTitle === docData.title) return
    try { await renameDocument(documentId, nextTitle); setDocData({ ...docData, title: nextTitle }) }
    catch (error) { setIssue(error.message); setTitle(docData.title) }
  }

  const createSnapshot = async () => {
    if (!editor || !editable) return
    try { await addVersion(documentId, editor.getJSON(), user); setMessage('Version saved.'); await refreshVersions() }
    catch (error) { setIssue(error.message) }
  }

  const restoreVersion = async (version) => {
    if (!editor || !editable || !window.confirm(`Restore version from ${formatDate(version.createdAt)}? The current content will be saved as a new version first.`)) return
    try {
      await addVersion(documentId, editor.getJSON(), user)
      editor.commands.setContent(version.content)
      setMessage('Previous version restored. The current version was saved to history.')
    } catch (error) { setIssue(error.message) }
  }

  const setLink = () => {
    if (!editor || !editable) return
    const existing = editor.getAttributes('link').href || ''
    const url = window.prompt('Enter a web address', existing)
    if (url === null) return
    if (!url.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  const handleImage = async (event) => {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file || !editor) return
    try { setIssue(''); const src = await uploadDocumentImage(documentId, file); editor.chain().focus().setImage({ src, alt: file.name }).run() }
    catch (error) { setIssue(error.message) }
  }

  const exportDocument = async (kind) => {
    if (!editor) return
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{max-width:760px;margin:50px auto;padding:0 30px;font:16px/1.7 Georgia,serif;color:#25304a}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd2df;padding:8px}</style></head><body>${editor.getHTML()}</body></html>`
    if (kind === 'html') return downloadFile(new Blob([html], { type: 'text/html' }), `${fileName(title)}.html`)
    if (kind === 'pdf') {
      const page = window.open('', '_blank')
      if (!page) { setIssue('Allow pop-ups to print this document as PDF.'); return }
      page.document.write(html); page.document.close(); page.focus(); page.print(); return
    }
    try {
      const { Document: WordDocument, HeadingLevel, Packer, Paragraph } = await import('docx')
      const paragraphs = (editor.getJSON().content || []).map((node) => new Paragraph({
        text: flattenDocumentText(node), heading: node.type === 'heading' ? ({ 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 }[node.attrs?.level] || HeadingLevel.HEADING_2) : undefined,
        bullet: node.type === 'bulletList' ? { level: 0 } : undefined,
        numbering: node.type === 'orderedList' ? { reference: 'numbers', level: 0 } : undefined,
      }))
      const word = new WordDocument({ numbering: { config: [{ reference: 'numbers', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: 'start' }] }] }, sections: [{ children: paragraphs.length ? paragraphs : [new Paragraph('')] }] })
      const blob = await Packer.toBlob(word); downloadFile(blob, `${fileName(title)}.docx`)
    } catch (error) { setIssue(`DOCX export failed: ${error.message}`) }
  }

  if (loading) return <LoadingScreen label="Opening document" />
  if (loadError) return <main className="editor-error-page"><div className="editor-error-card"><span className="error-mark"><CircleAlert size={25} /></span><h1>Can’t open this document</h1><p>{loadError}</p><Link className="primary-button" to="/">Back to workspace</Link></div></main>
  const statusLabel = connection === 'connected' ? saveStatus === 'saving' ? 'Saving changes…' : saveStatus === 'error' ? 'Save failed' : 'All changes saved' : connection === 'disconnected' ? 'Reconnecting…' : 'Connecting…'

  return <main className="editor-page">
    <header className="editor-topbar"><Link to="/" className="back-workspace" title="Back to workspace"><ArrowLeft size={18} /></Link><span className="editor-brand-mark"><CloudIcon /></span><div className="editor-title-wrap">{editingTitle && editable ? <input ref={titleInput} value={title} onChange={(event) => setTitle(event.target.value)} onBlur={saveTitle} onKeyDown={(event) => event.key === 'Enter' && saveTitle()} aria-label="Document title" /> : <button className="document-title-button" onClick={() => editable && setEditingTitle(true)} title={editable ? 'Rename document' : title}>{title}</button>}<span className={`save-indicator save-${saveStatus}`}><i />{statusLabel}</span></div><div className="editor-top-actions"><div className="collaborator-stack">{collaborators.slice(0, 4).map((person, index) => <span key={`${person.id}-${index}`} className="avatar collaborator-avatar" style={{ background: person.color || '#6575df' }} title={person.name}>{(person.name || 'U')[0].toUpperCase()}</span>)}{collaborators.length > 4 && <span className="avatar avatar-overflow">+{collaborators.length - 4}</span>}</div>{collaborators.length > 0 && <span className="live-count"><span />{collaborators.length} online</span>}{docData.role === 'owner' && <button className="primary-button share-button" onClick={() => setShareOpen(true)}><Share2 size={15} />Share</button>}<button className="avatar avatar-header" title={profile?.name}>{(profile?.name || user.email || 'U')[0].toUpperCase()}</button></div></header>
    <div className="editor-toolbar-row"><div className="editor-toolbar">
      <button className="tool-button tool-back" onClick={() => navigate('/')} title="Back"><ArrowLeft size={17} /></button><span className="toolbar-divider" />
      <button className="tool-button" title="Undo" onClick={() => editor?.chain().focus().undo().run()}><Undo2 size={17} /></button><button className="tool-button" title="Redo" onClick={() => editor?.chain().focus().redo().run()}><Redo2 size={17} /></button><span className="toolbar-divider" />
      <select className="text-style-select" value={editor?.isActive('heading', { level: 1 }) ? 'h1' : editor?.isActive('heading', { level: 2 }) ? 'h2' : 'p'} onChange={(event) => event.target.value === 'h1' ? editor?.chain().focus().toggleHeading({ level: 1 }).run() : event.target.value === 'h2' ? editor?.chain().focus().toggleHeading({ level: 2 }).run() : editor?.chain().focus().setParagraph().run()} aria-label="Text style"><option value="p">Normal text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option></select><span className="toolbar-divider" />
      <Tool active={editor?.isActive('bold')} title="Bold" onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={17} /></Tool><Tool active={editor?.isActive('italic')} title="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={17} /></Tool><Tool active={editor?.isActive('underline')} title="Underline" onClick={() => editor?.chain().focus().toggleUnderline().run()}><UnderlineIcon size={17} /></Tool><Tool active={editor?.isActive('strike')} title="Strikethrough" onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough size={17} /></Tool><Tool active={editor?.isActive('highlight')} title="Highlight" onClick={() => editor?.chain().focus().toggleHighlight().run()}><Highlighter size={17} /></Tool><Tool title="Text color" onClick={() => editor?.chain().focus().setColor(window.prompt('Enter a color (for example #5268e8)', '#5268e8') || '#5268e8').run()}><Palette size={17} /></Tool><span className="toolbar-divider" />
      <Tool active={editor?.isActive('bulletList')} title="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={17} /></Tool><Tool active={editor?.isActive('orderedList')} title="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={17} /></Tool><span className="toolbar-divider" />
      <Tool title="Align left" onClick={() => editor?.chain().focus().setTextAlign('left').run()}><AlignLeft size={17} /></Tool><Tool title="Align center" onClick={() => editor?.chain().focus().setTextAlign('center').run()}><AlignCenter size={17} /></Tool><Tool title="Align right" onClick={() => editor?.chain().focus().setTextAlign('right').run()}><AlignRight size={17} /></Tool><span className="toolbar-divider" />
      <Tool title="Insert link" onClick={setLink}><Link2 size={17} /></Tool><Tool title="Insert image" onClick={() => imageInput.current?.click()}><ImagePlus size={17} /></Tool><input ref={imageInput} hidden type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleImage} /><Tool title="Insert table" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 size={17} /></Tool><Tool title="Block quote" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={17} /></Tool>
    </div><div className="editor-side-tools"><button className={`tool-button ${versionsOpen ? 'tool-active' : ''}`} onClick={() => { setVersionsOpen(!versionsOpen); if (!versionsOpen) refreshVersions() }} title="Version history"><Clock3 size={17} /></button><ExportMenu onExport={exportDocument} /><button className="tool-button" title="Save version" onClick={createSnapshot}><Save size={16} /></button></div></div>
    <section className="editor-workspace"><div className="document-canvas-wrap"><div className="document-canvas"><div className="canvas-topline"><span className="canvas-brand"><CloudIcon />CloudSync document</span><span>{docData.role === 'owner' ? 'Owner' : docData.role === 'editor' ? 'Can edit' : 'View only'}</span></div>{editor ? <EditorContent editor={editor} className={`tiptap-content ${!editable ? 'viewer-content' : ''}`} /> : <div className="editor-loading"><LoaderCircle className="spin" size={20} />Loading document editor…</div>}<div className="canvas-footer">CloudSync · Your work, in sync</div></div></div>
      {versionsOpen && <aside className="version-panel"><div className="version-panel-header"><div><span className="panel-kicker">DOCUMENT HISTORY</span><h2>Versions</h2></div><button className="icon-button" onClick={() => setVersionsOpen(false)} aria-label="Close version history"><X size={18} /></button></div><p className="version-intro">Snapshots let you revisit an earlier version. Restoring saves your current work first.</p><button className="outline-button snapshot-button" onClick={createSnapshot} disabled={!editable}><Save size={15} />Save current version</button>{versionsLoading ? <p className="muted-line">Loading history…</p> : versions.length ? <div className="version-list">{versions.map((version) => <article className="version-item" key={version.id}><span className="version-dot" /><div><b>{formatDate(version.createdAt)}</b><small>{version.createdByName || 'A collaborator'}</small><p>{summarize(version.content)}</p></div>{editable && <button className="restore-button" onClick={() => restoreVersion(version)} title="Restore this version"><RotateCcw size={15} /></button>}</article>)}</div> : <div className="version-empty"><Clock3 size={22} /><b>No versions yet</b><span>Save a snapshot to start document history.</span></div>}</aside>}
    </section>
    {(message || issue) && <div className={`editor-notice ${issue ? 'notice-error' : ''}`}><span>{issue || message}</span><button onClick={() => { setIssue(''); setMessage('') }} aria-label="Dismiss"><X size={15} /></button></div>}
    {shareOpen && <ShareDialog documentId={documentId} title={title} onClose={() => setShareOpen(false)} />}
  </main>
}

function Tool({ children, title, onClick, active }) { return <button className={`tool-button ${active ? 'tool-active' : ''}`} title={title} aria-label={title} onClick={onClick}>{children}</button> }
function ExportMenu({ onExport }) { const [open, setOpen] = useState(false); return <div className="export-menu-wrap"><button className="tool-button export-trigger" title="Export document" onClick={() => setOpen(!open)}><Download size={16} /><ChevronDown size={12} /></button>{open && <div className="action-menu export-menu">{[['pdf', 'Download as PDF'], ['docx', 'Download as DOCX'], ['html', 'Download as HTML']].map(([kind, label]) => <button key={kind} onClick={() => { setOpen(false); onExport(kind) }}><FileDown size={15} />{label}</button>)}</div>}</div> }
function CloudIcon() { return <span className="mini-cloud"><Cloud size={16} /></span> }
function summarize(content) { return flattenDocumentText(content).replace(/\s+/g, ' ').slice(0, 95) || 'Empty document snapshot' }
function formatDate(value) { const date = value?.toDate ? value.toDate() : value ? new Date(value) : new Date(); return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }
function fileName(value) { return sanitizeFileName(value) }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])) }
function downloadFile(blob, name) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
