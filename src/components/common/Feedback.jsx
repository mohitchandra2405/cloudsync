import { LoaderCircle, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { Component, useEffect, useState } from 'react'

export function LoadingScreen({ label = 'Loading' }) {
  return <main className="loading-screen"><LoaderCircle className="spin" size={24} /><span>{label}…</span></main>
}

export function ErrorBanner({ children }) {
  return children ? <div className="error-banner" role="alert"><AlertCircle size={17} /><span>{children}</span></div> : null
}

export function Toast({ message, type = 'success', onClose }) {
  if (!message) return null
  const Icon = type === 'error' ? AlertCircle : CheckCircle2
  return <div className={`toast toast-${type}`} role="status"><Icon size={18} /><span>{message}</span><button aria-label="Dismiss" onClick={onClose}><X size={16} /></button></div>
}

export function notifyToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('cloudsync-toast', { detail: { message, type } }))
}

export function ToastHost() {
  const [toast, setToast] = useState(null)
  useEffect(() => {
    let timer
    const receive = (event) => {
      setToast(event.detail)
      clearTimeout(timer)
      timer = setTimeout(() => setToast(null), 3800)
    }
    window.addEventListener('cloudsync-toast', receive)
    return () => { window.removeEventListener('cloudsync-toast', receive); clearTimeout(timer) }
  }, [])
  return <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
}

export class AppErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('CloudSync screen failed to load', error) }
  render() {
    if (this.state.failed) return <main className="loading-screen error-screen"><div><AlertCircle size={24} /><h1>CloudSync hit a snag</h1><p>Reload the page to reconnect to your workspace.</p><button className="primary-button" onClick={() => window.location.reload()}>Reload CloudSync</button></div></main>
    return this.props.children
  }
}
