import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import App from './App'
import LoginScreen from './components/LoginScreen'
import { clearSession, setSession, getSession, loadUserData } from './lib/auth'
import { exportData, daysSinceLastBackup } from './lib/backup'
import './index.css'

function Root() {
  const [session, setSessionState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [backupBanner, setBackupBanner] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Ripristina la sessione salvata (resta loggato tra le visite)
    const s = getSession()
    if (s) setSessionState(s)
    setLoading(false)
  }, [])

  const handleLogin = async (userId, userName) => {
    setLoading(true)
    await loadUserData(userId)
    setSession(userId, userName)
    setSessionState({ userId, userName })
    navigate('/', { replace: true }) // torna sempre alla Home al login
    // Auto-download backup if 7+ days — triggered inside login click chain so browser allows it
    if (daysSinceLastBackup() >= 7) {
      exportData()
    } else if (daysSinceLastBackup() >= 5) {
      setBackupBanner(true)
    }
    setLoading(false)
  }

  const handleLogout = () => {
    clearSession()
    setSessionState(null)
    setBackupBanner(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session) return <LoginScreen onLogin={handleLogin} />

  return (
    <App
      session={session}
      onLogout={handleLogout}
      backupBanner={backupBanner}
      onDismissBackup={() => setBackupBanner(false)}
    />
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter><Root /></BrowserRouter>
)
