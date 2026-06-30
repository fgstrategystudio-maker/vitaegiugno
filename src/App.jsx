import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Timeline from './pages/Timeline'
import Injuries from './pages/Injuries'
import Documents from './pages/Documents'
import Patterns from './pages/Patterns'
import Measurements from './pages/Measurements'
import Diary from './pages/Diary'
import Doctors from './pages/Doctors'
import Screening from './pages/Screening'
import Settings from './pages/Settings'
import Watchlist from './pages/Watchlist'
import Analisi from './pages/Analisi'
import AnalisiSangue from './pages/AnalisiSangue'
import Sintesi from './pages/Sintesi'
import Family from './pages/Family'
import Vaccini from './pages/Vaccini'
import Viaggi from './pages/Viaggi'
import CicloMestruale from './pages/CicloMestruale'
import Gravidanza from './pages/Gravidanza'
import Polizze from './pages/Polizze'
import Emergenza from './pages/Emergenza'

export default function App({ session, onLogout, backupBanner, onDismissBackup }) {
  return (
    <Layout session={session} onLogout={onLogout} backupBanner={backupBanner} onDismissBackup={onDismissBackup}>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/infortuni" element={<Injuries />} />
        <Route path="/documenti" element={<Documents />} />
        <Route path="/pattern" element={<Patterns />} />
        <Route path="/misurazioni" element={<Measurements />} />
        <Route path="/diario" element={<Diary />} />
        <Route path="/medici" element={<Doctors />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/screening" element={<Screening />} />
        <Route path="/vaccini" element={<Vaccini />} />
        <Route path="/viaggi" element={<Viaggi />} />
        <Route path="/impostazioni" element={<Settings onLogout={onLogout} />} />
        <Route path="/analisi" element={<Analisi />} />
        <Route path="/sangue" element={<AnalisiSangue />} />
        <Route path="/sintesi" element={<Sintesi />} />
        <Route path="/famiglia" element={<Family />} />
        <Route path="/ciclo" element={<CicloMestruale />} />
        <Route path="/gravidanza" element={<Gravidanza />} />
        <Route path="/polizze" element={<Polizze />} />
        <Route path="/emergenza" element={<Emergenza />} />
      </Routes>
    </Layout>
  )
}
