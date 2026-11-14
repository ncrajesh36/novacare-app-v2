import { useEffect, useRef, useState } from 'react'
import { Home, Camera, Bell, Sparkles, Wallet as WalletIcon, MessageCircle, Share } from 'lucide-react'
import ReminderList from './ReminderList'
import AlertList from './AlertList'
import Capture from './Capture'
import Wallet from './Wallet'
import Chat from './Chat'
import { api } from './apiClient'

const FALLBACK_REMINDERS = [
  { id: 1, label: 'Morning pills', done: true },
  { id: 2, label: 'Check blood pressure', done: false },
  { id: 3, label: 'Evening pills', done: false },
]

const FALLBACK_ALERTS = [
  { id: 1, text: 'Rosa confirmed: Morning pills', time: '7:04 AM' },
]

function isIosSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone = window.navigator.standalone === true
  return iOS && !standalone
}

function App() {
  const [role, setRole] = useState('patient')
  const [patientTab, setPatientTab] = useState('home')
  const [sponsorTab, setSponsorTab] = useState('dashboard')
  const [showInstallHint, setShowInstallHint] = useState(false)
  const [reminders, setReminders] = useState(FALLBACK_REMINDERS)
  const [alerts, setAlerts] = useState(FALLBACK_ALERTS)
  const [balance, setBalance] = useState(84.5)
  const [sampleData, setSampleData] = useState(true)
  const [ready, setReady] = useState(false)
  const persistTimer = useRef(null)
  const skipNextPersist = useRef(true)

  useEffect(() => {
    if (!isIosSafari()) return
    if (sessionStorage.getItem('novacare-install-hint') === '1') return
    setShowInstallHint(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const state = await api('/api/state')
        if (cancelled) return
        setReminders(state.reminders || FALLBACK_REMINDERS)
        setAlerts(state.alerts || FALLBACK_ALERTS)
        setBalance(typeof state.balance === 'number' ? state.balance : 84.5)
        setSampleData(Boolean(state.sampleData))
      } catch {
        if (!cancelled) setSampleData(true)
      } finally {
        if (!cancelled) {
          skipNextPersist.current = true
          setReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    if (skipNextPersist.current) {
      skipNextPersist.current = false
      return
    }
    clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(async () => {
      try {
        const state = await api('/api/state', {
          method: 'PUT',
          body: JSON.stringify({ reminders, alerts, balance }),
        })
        setSampleData(Boolean(state.sampleData))
      } catch {
        // Keep UI usable offline; next successful sync will save.
      }
    }, 300)
    return () => clearTimeout(persistTimer.current)
  }, [reminders, alerts, balance, ready])

  const dismissInstallHint = () => {
    sessionStorage.setItem('novacare-install-hint', '1')
    setShowInstallHint(false)
  }

  const pushAlert = (text) => {
    setAlerts((prev) => [{ id: Date.now(), text, time: 'just now' }, ...prev].slice(0, 100))
  }

  const toggleReminder = (id) => {
    setReminders((prev) => {
      const reminder = prev.find((r) => r.id === id)
      const next = prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
      if (reminder && !reminder.done) {
        queueMicrotask(() => pushAlert(`Rosa confirmed: ${reminder.label}`))
      }
      return next
    })
  }

  const topUp = (amount) => {
    setBalance((prev) => prev + amount)
    pushAlert(`Wallet topped up with $${amount}`)
  }

  const patientTabs = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'capture', label: 'Capture', icon: Camera },
    { key: 'reminders', label: 'Reminders', icon: Bell },
    { key: 'chat', label: 'Talk', icon: MessageCircle },
  ]
  const sponsorTabs = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'alerts', label: 'Alerts', icon: Bell },
    { key: 'wallet', label: 'Wallet', icon: WalletIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="w-full max-w-sm h-[700px] bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden flex flex-col">

        <div className="flex items-center justify-between px-5 pt-3 pb-1 text-xs font-semibold text-gray-900">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <Sparkles size={12} />
            <span>NovaCare</span>
          </div>
        </div>

        {sampleData && (
          <p className="px-5 pb-1 text-[10px] text-gray-400">Using sample data until Postgres is connected</p>
        )}

        {showInstallHint && (
          <div className="mx-4 mb-2 rounded-2xl bg-teal-50 border border-teal-100 px-3 py-2 text-xs text-teal-900">
            <div className="flex items-start gap-2">
              <Share size={14} className="mt-0.5 shrink-0" />
              <p className="flex-1 leading-snug">
                Install on iPhone: tap <span className="font-semibold">Share</span>, then{' '}
                <span className="font-semibold">Add to Home Screen</span>.
              </p>
              <button
                type="button"
                onClick={dismissInstallHint}
                className="font-semibold text-teal-700 shrink-0"
              >
                OK
              </button>
            </div>
          </div>
        )}

        <div className="px-4 pt-2 pb-3">
          <div className="flex rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setRole('patient')}
              className={`flex-1 py-2 rounded-full text-sm font-semibold ${role === 'patient' ? 'bg-amber-500 text-white' : 'text-gray-500'}`}
            >
              Rosa
            </button>
            <button
              onClick={() => setRole('sponsor')}
              className={`flex-1 py-2 rounded-full text-sm font-semibold ${role === 'sponsor' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
            >
              Carlos
            </button>
          </div>
        </div>

        <div key={role === 'patient' ? patientTab : sponsorTab} className="flex-1 overflow-y-auto p-6 animate-fadein">
          {role === 'patient' ? (
            <>
              {patientTab === 'home' && (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Today's Reminders 💊</h1>
                  <ReminderList reminders={reminders} onToggle={toggleReminder} />
                </>
              )}
              {patientTab === 'capture' && (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Capture a reading</h1>
                  <Capture onCaptured={pushAlert} />
                </>
              )}
              {patientTab === 'reminders' && (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">All reminders</h1>
                  <ReminderList reminders={reminders} onToggle={toggleReminder} />
                </>
              )}
              {patientTab === 'chat' && (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Talk to us</h1>
                  <Chat />
                </>
              )}
            </>
          ) : (
            <>
              {sponsorTab === 'dashboard' && (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Hi, Carlos</h1>
                  <AlertList alerts={alerts.slice(0, 3)} />
                </>
              )}
              {sponsorTab === 'alerts' && (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">All alerts</h1>
                  <AlertList alerts={alerts} />
                </>
              )}
              {sponsorTab === 'wallet' && (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Wallet</h1>
                  <Wallet balance={balance} onTopup={topUp} />
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-around px-2 pt-2 pb-6 border-t border-gray-100">
          {(role === 'patient' ? patientTabs : sponsorTabs).map((t) => {
            const Icon = t.icon
            const active = role === 'patient' ? patientTab === t.key : sponsorTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => (role === 'patient' ? setPatientTab(t.key) : setSponsorTab(t.key))}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <Icon size={20} color={active ? (role === 'patient' ? '#d97706' : '#2563eb') : '#9ca3af'} />
                <span className={`text-[10px] font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default App
