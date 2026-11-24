import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { AppErrorBoundary, LoadingScreen, ToastHost } from './components/common/Feedback.jsx'

const Login = lazy(() => import('./pages/Login.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const DocumentEditor = lazy(() => import('./pages/DocumentEditor.jsx'))
const SharedDocuments = lazy(() => import('./pages/SharedDocuments.jsx'))
const RecentDocuments = lazy(() => import('./pages/RecentDocuments.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen label="Checking your workspace" />
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen label="Connecting to CloudSync" />
  return <><AppErrorBoundary><Suspense fallback={<LoadingScreen label="Loading your workspace" />}><Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
    <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
    <Route path="/" element={<Protected><Dashboard /></Protected>} />
    <Route path="/shared" element={<Protected><SharedDocuments /></Protected>} />
    <Route path="/recent" element={<Protected><RecentDocuments /></Protected>} />
    <Route path="/settings" element={<Protected><Settings /></Protected>} />
    <Route path="/documents/:documentId" element={<Protected><DocumentEditor /></Protected>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></AppErrorBoundary><ToastHost /></>
}
