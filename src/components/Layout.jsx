import React, { useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Home, Activity, ClipboardList, Zap, BookOpen, BarChart2, Microscope,
  ShieldCheck, Syringe, TrendingUp, FileText, Stethoscope, Users,
  Brain, Settings, Moon, Sun, Menu, Download, Upload, Plane,
  Droplet, Siren, Receipt, HelpCircle
} from 'lucide-react'
import { exportData } from '../lib/backup'
import { syncKey } from '../lib/auth'
import OnboardingModal from './OnboardingModal'
import TabTour from './TabTour'
import Assistant from './Assistant'
import { hasOnboarded, setOnboarded } from '../lib/help'

const NAV_GROUPS = [
  {
    section: 'PANORAMICA',
    items: [
      { to: '/',          icon: Home,          label: 'Home'      },
      { to: '/timeline',  icon: Activity,      label: 'Timeline'  },
      { to: '/sintesi',   icon: ClipboardList, label: 'Sintesi'   },
      { to: '/emergenza', icon: Siren,         label: 'Emergenza' },
    ]
  },
  {
    section: 'DIARIO CLINICO',
    items: [
      { to: '/infortuni',   icon: Zap,         label: 'Infortuni'          },
      { to: '/watchlist',   icon: BookOpen,    label: 'Diario ed Appunti'  },
      { to: '/misurazioni', icon: BarChart2,   label: 'Misurazioni'        },
      { to: '/sangue',      icon: Microscope,  label: 'Analisi sangue'     },
      { to: '/ciclo',       icon: Droplet,     label: 'Ciclo mestruale'    },
    ]
  },
  {
    section: 'PREVENZIONE',
    items: [
      { to: '/screening', icon: ShieldCheck, label: 'Screening' },
      { to: '/vaccini',   icon: Syringe,     label: 'Vaccini'   },
      { to: '/pattern',   icon: TrendingUp,  label: 'Pattern'   },
    ]
  },
  {
    section: 'ASSICURAZIONE',
    items: [
      { to: '/polizze', icon: Receipt, label: 'Polizze & Rimborsi' },
    ]
  },
  {
    section: 'ARCHIVIO',
    items: [
      { to: '/documenti', icon: FileText,    label: 'Documenti' },
      { to: '/medici',    icon: Stethoscope, label: 'Medici'    },
      { to: '/famiglia',  icon: Users,       label: 'Famiglia'  },
      { to: '/viaggi',    icon: Plane,       label: 'Viaggi'    },
    ]
  },
  {
    section: 'SISTEMA',
    items: [
      { to: '/analisi',      icon: Brain,    label: 'Analisi AI'   },
      { to: '/impostazioni', icon: Settings, label: 'Impostazioni' },
    ]
  },
]

const PAGE_META = {
  '/':             { eyebrow: 'PANORAMICA',     title: 'Dashboard'          },
  '/timeline':     { eyebrow: 'PANORAMICA',     title: 'Timeline'           },
  '/sintesi':      { eyebrow: 'PANORAMICA',     title: 'Sintesi Clinica'    },
  '/emergenza':    { eyebrow: 'PANORAMICA',     title: 'Emergenza'          },
  '/ciclo':        { eyebrow: 'DIARIO CLINICO', title: 'Ciclo mestruale'    },
  '/polizze':      { eyebrow: 'ASSICURAZIONE',  title: 'Polizze & Rimborsi' },
  '/infortuni':    { eyebrow: 'DIARIO CLINICO', title: 'Infortuni'          },
  '/watchlist':    { eyebrow: 'DIARIO CLINICO', title: 'Diario ed Appunti'  },
  '/misurazioni':  { eyebrow: 'DIARIO CLINICO', title: 'Misurazioni'        },
  '/sangue':       { eyebrow: 'DIARIO CLINICO', title: 'Analisi del Sangue' },
  '/screening':    { eyebrow: 'PREVENZIONE',    title: 'Screening'          },
  '/vaccini':      { eyebrow: 'PREVENZIONE',    title: 'Vaccini'            },
  '/pattern':      { eyebrow: 'PREVENZIONE',    title: 'Pattern'            },
  '/documenti':    { eyebrow: 'ARCHIVIO',       title: 'Documenti'          },
  '/medici':       { eyebrow: 'ARCHIVIO',       title: 'Medici'             },
  '/famiglia':     { eyebrow: 'ARCHIVIO',       title: 'Famiglia'           },
  '/viaggi':       { eyebrow: 'ARCHIVIO',       title: 'Viaggi'             },
  '/analisi':      { eyebrow: 'SISTEMA',        title: 'Analisi AI'         },
  '/impostazioni': { eyebrow: 'SISTEMA',        title: 'Impostazioni'       },
}

export default function Layout({ children, session, onLogout, backupBanner, onDismissBackup }) {
  const importRef = useRef()
  const location  = useLocation()
  const [darkMode, setDarkMode] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showOnboard, setShowOnboard] = useState(() => !hasOnboarded())
  const [tourReplay, setTourReplay] = useState(0)

  const closeOnboard = () => { setOnboarded(); setShowOnboard(false) }

  // Tema default: Gioiello (blu-grigio, palette gioiello vivida)
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'gioiello')
  }, [])

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.setAttribute('data-mode', next ? 'dark' : '')
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target.result)
        if (!json.version) { alert('File non valido'); return }
        const entries = Object.entries(json.data || {})
        entries.forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)))
        for (const [k, v] of entries) {
          if (!k.startsWith('mcd_pin')) {
            try { await syncKey(k, v) } catch {}
          }
        }
        window.location.reload()
      } catch { alert('Errore nella lettura del file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const userName = session?.userName ?? 'Utente'
  const initials = userName.slice(0, 2).toUpperCase()
  const meta = PAGE_META[location.pathname] ?? { eyebrow: 'PANORAMICA', title: 'Dashboard' }

  return (
    <div className="cc-app">
      {/* Scrim (mobile) */}
      <div
        className={`cc-scrim${menuOpen ? ' show' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Sidebar rail */}
      <aside className={`cc-rail${menuOpen ? ' open' : ''}`}>
        {/* Brand */}
        <div className="cc-rail-brand">
          <div className="cc-rail-mark">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 21s-7-4.5-7-9.7A3.9 3.9 0 0 1 12 9a3.9 3.9 0 0 1 7 2.3C19 16.5 12 21 12 21z"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', letterSpacing: '0', textTransform: 'none', fontWeight: 600 }}>
            Vitae
            <span style={{ fontFamily: 'var(--font-sans)', letterSpacing: '.02em', textTransform: 'none' }}>Cartella clinica personale</span>
          </h1>
        </div>

        {/* Nav */}
        <nav className="cc-rail-nav">
          {NAV_GROUPS.map(({ section, items }) => (
            <React.Fragment key={section}>
              <div className="cc-rail-sec">{section}</div>
              {items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => 'cc-nav-item' + (isActive ? ' active' : '')}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon />
                  {label}
                </NavLink>
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer */}
        <div className="cc-rail-foot">
          <div className="cc-rail-ava">{initials}</div>
          <div>
            <div className="nm">{userName}</div>
            <div className="rl">Paziente</div>
          </div>
          <button className="sw" onClick={toggleDark} title={darkMode ? 'Modalità chiara' : 'Modalità scura'}>
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="cc-main">
        <div className="cc-main-inner">
          {/* Topbar */}
          <div className="cc-topbar">
            <div>
              <button className="cc-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Apri menu">
                <Menu />
              </button>
              <div className="cc-eyebrow">{meta.eyebrow}</div>
              <h2 className="cc-page-title">{meta.title}</h2>
            </div>
            <div className="cc-topbar-actions">
              <button
                className="cc-help-btn"
                onClick={() => setTourReplay((n) => n + 1)}
                title="Rivedi il tutorial di questa sezione"
                aria-label="Aiuto sezione"
              >
                <HelpCircle size={18} />
              </button>
              <button className="cc-btn-ghost" onClick={exportData}>
                <Download size={15} />
                Backup
              </button>
              <button className="cc-btn-ghost" onClick={() => importRef.current?.click()}>
                <Upload size={15} />
                Ripristina
              </button>
            </div>
          </div>

          {/* Backup banner */}
          {backupBanner && (
            <div className="cc-backup-banner">
              <span style={{ flex: 1 }}>
                Backup automatico: sono passati 7+ giorni dall&apos;ultimo salvataggio.
              </span>
              <button className="cc-backup-dl" onClick={() => { exportData(); onDismissBackup?.() }}>
                Scarica ora
              </button>
              <button className="cc-backup-x" onClick={onDismissBackup}>✕</button>
            </div>
          )}

          {/* Page content */}
          <div className="cc-page" key={location.pathname}>
            {children ?? <Outlet />}
          </div>
        </div>
      </main>

      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* Onboarding (primo accesso) · tutorial della scheda · assistente virtuale */}
      {showOnboard && <OnboardingModal onClose={closeOnboard} />}
      <TabTour path={location.pathname} replayKey={tourReplay} enabled={!showOnboard} />
      <Assistant path={location.pathname} />
    </div>
  )
}
