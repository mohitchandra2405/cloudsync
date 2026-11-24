import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Cloud, FileText, FolderOpen, Clock3, UsersRound, Star, Trash2, Settings, LogOut, Menu, X, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { logoutUser } from '../../services/authService.js'

const links = [
  { to: '/', label: 'Home', icon: Cloud, end: true },
  { to: '/?view=my-documents', label: 'My documents', icon: FolderOpen },
  { to: '/shared', label: 'Shared with me', icon: UsersRound },
  { to: '/recent', label: 'Recent', icon: Clock3 },
  { to: '/?view=starred', label: 'Starred', icon: Star },
  { to: '/?view=trash', label: 'Trash', icon: Trash2 },
]

export default function WorkspaceLayout({ children, showSearch = false, search, setSearch }) {
  const { user, profile } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const initials = (profile?.name || user?.email || 'U').split(/[\s@]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const handleLogout = async () => { await logoutUser(); navigate('/login') }

  return <div className="workspace-shell">
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Cloud size={21} /></span><span>cloud<span className="brand-accent">sync</span></span><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
      <button className="new-doc-button" onClick={() => navigate('/?create=1')}><span>＋</span> New document</button>
      <nav className="side-nav" aria-label="Workspace navigation">
        <p className="nav-caption">WORKSPACE</p>
        {links.map(({ to, label, icon: Icon }) => {
          const selectedView = new URLSearchParams(location.search).get('view')
          const active = to === '/' ? location.pathname === '/' && !selectedView : to.startsWith('/?view=') ? location.pathname === '/' && selectedView === to.split('=')[1] : location.pathname === to
          return <NavLink key={label} to={to} onClick={() => setMobileOpen(false)} className={`nav-link ${active ? 'nav-link-active' : ''}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></NavLink>
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="storage-card"><div className="storage-heading"><span className="storage-dot" />Cloud workspace</div><p>Your files are synced and backed up.</p><div className="storage-track"><span /></div><small>Secure cloud storage</small></div>
        <NavLink to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'nav-link-active' : ''}`}><Settings size={18} /><span>Settings</span></NavLink>
        <button className="profile-row" onClick={() => navigate('/settings')}><span className="avatar avatar-small">{initials}</span><span className="profile-copy"><b>{profile?.name || 'Your account'}</b><small>{user?.email}</small></span><span className="profile-more">•••</span></button>
      </div>
    </aside>
    <main className="workspace-main">
      <header className="workspace-header">
        <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
        <div className="breadcrumb"><FileText size={16} /><span>Workspace</span><span className="crumb-slash">/</span><b>Documents</b></div>
        <div className="header-actions">
          {showSearch && <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents" /><kbd>⌘ K</kbd></label>}
          <button className="icon-button" title="Settings" onClick={() => navigate('/settings')}><Settings size={18} /></button>
          <button className="avatar avatar-header" title="Account settings" onClick={() => navigate('/settings')}>{initials}</button>
          <button className="icon-button logout-button" title="Sign out" onClick={handleLogout}><LogOut size={17} /></button>
        </div>
      </header>
      <section className="workspace-content">{children}</section>
    </main>
  </div>
}
