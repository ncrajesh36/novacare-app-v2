import { useState } from 'react'
import { Home, Camera, Bell, Sparkles, Wallet as WalletIcon } from 'lucide-react'
import ReminderList from './ReminderList'
import AlertList from './AlertList'
import Capture from './Capture'
import Wallet from './Wallet'

function App() {
  const [role, setRole] = useState('patient')
  const [patientTab, setPatientTab] = useState('home')
  const [sponsorTab, setSponsorTab] = useState('dashboard')

  const [reminders, setReminders] = useState([
    { id: 1, label: 'Morning pills', done: true },
    { id: 2, label: 'Check blood pressure', done: false },
    { id: 3, label: 'Evening pills', done: false },
  ])

  const [alerts, setAlerts] = useState([
    { id: 1, text: 'Rosa confirmed: Morning pills', time: '7:04 AM' },
  ])

  const [balance, setBalance] = useState(84.50)

  const pushAlert = (text) => {
    setAlerts((prev) => [{ id: Date.now(), text, time: 'just now' }, ...prev])
  }

  const toggleReminder = (id) => {
    const reminder = reminders.find((r) => r.id === id)
    setReminders(reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)))
    if (reminder && !reminder.done) pushAlert(`Rosa confirmed: ${reminder.label}`)
  }

  const topUp = (amount) => {
    setBalance((prev) => prev + amount)
    pushAlert(`Wallet topped up with $${amount}`)
  }

  const patientTabs = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'capture', label: 'Capture', icon: Camera },
    { key: 'reminders', label: 'Reminders', icon: Bell },
  ]
  const sponsorTabs = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'alerts', label: 'Alerts', icon: Bell },
    { key: 'wallet', label: 'Wallet', icon: WalletIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="w-full max-w-sm h-[700px] bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden flex flex-col">

        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 text-xs font-semibold text-gray-900">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <Sparkles size={12} />
            <span>NovaCare</span>
          </div>
        </div>

        {/* Role switch */}
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

        {/* Screen content */}
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

        {/* Bottom tab bar */}
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