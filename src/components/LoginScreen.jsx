import React, { useState, useEffect } from 'react'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { register, login } from '../lib/auth'

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'gioiello')
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const sess = mode === 'signup'
        ? await register(email, password, name || email.split('@')[0])
        : await login(email, password)
      await onLogin(sess.userId, sess.userName)
    } catch (err) {
      setError(err.message || 'Errore, riprova')
      setLoading(false)
    }
  }

  const wrap = {
    minHeight: '100vh', background: 'var(--canvas)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-sans)', padding: '20px 16px',
  }
  const card = {
    background: 'var(--panel)', border: '1px solid var(--hair)',
    borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-lg)',
    width: '100%', maxWidth: 380, padding: '36px 30px 30px',
  }
  const field = {
    display: 'flex', alignItems: 'center', gap: 10,
    border: '1px solid var(--hair)', borderRadius: 'var(--r)',
    background: 'var(--panel-2)', padding: '11px 13px', marginBottom: 12,
  }
  const inp = {
    border: 'none', outline: 'none', background: 'transparent',
    flex: 1, fontSize: 14.5, color: 'var(--ink)', fontFamily: 'var(--font-sans)',
  }

  return (
    <div style={wrap}>
      <div style={card}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #4FA6DD 0%, #C8A24A 100%)',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 8px 22px -8px rgba(79,140,190,.6)',
          }}>
            <svg viewBox="0 0 24 24" fill="#fff" width="26" height="26">
              <path d="M12 21s-7-4.5-7-9.7A3.9 3.9 0 0 1 12 9a3.9 3.9 0 0 1 7 2.3C19 16.5 12 21 12 21z" />
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 600, color: 'var(--accent-deep)', lineHeight: 1 }}>Vitae</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6 }}>Cartella clinica personale</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--panel-2)', border: '1px solid var(--hair)', borderRadius: 'var(--r)', padding: 4, marginBottom: 20 }}>
          {[['login', 'Accedi'], ['signup', 'Crea account']].map(([m, lbl]) => (
            <button key={m} type="button" onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--ink-2)',
                transition: 'background .15s',
              }}>{lbl}</button>
          ))}
        </div>

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <div style={field}>
              <User size={17} color="var(--ink-3)" />
              <input style={inp} placeholder="Nome" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
            </div>
          )}
          <div style={field}>
            <Mail size={17} color="var(--ink-3)" />
            <input style={inp} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div style={field}>
            <Lock size={17} color="var(--ink-3)" />
            <input style={inp} type={show ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required />
            <button type="button" onClick={() => setShow(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <div style={{ fontSize: 12.5, color: 'var(--danger)', fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px 0', borderRadius: 'var(--r)', border: 'none',
            background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14.5,
            fontFamily: 'var(--font-sans)', cursor: loading ? 'default' : 'pointer',
            opacity: loading ? .7 : 1, marginTop: 4,
          }}>
            {loading ? 'Attendere…' : mode === 'signup' ? 'Crea account' : 'Accedi'}
          </button>
        </form>

        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', textAlign: 'center', marginTop: 18, lineHeight: 1.5 }}>
          I tuoi dati clinici sono protetti e collegati al tuo account.
        </div>
      </div>
    </div>
  )
}
