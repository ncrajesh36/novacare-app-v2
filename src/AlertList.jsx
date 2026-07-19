import { CheckCircle2 } from 'lucide-react'

function AlertList({ alerts }) {
  return (
    <div className="flex flex-col gap-3 max-w-sm">
      {alerts.map((a) => (
        <div key={a.id} className="flex items-start gap-3 p-4 rounded-2xl border border-gray-200 bg-white">
          <CheckCircle2 size={18} color="#0f766e" className="mt-0.5" />
          <div>
            <p className="text-sm text-gray-900">{a.text}</p>
            <p className="text-xs text-gray-400 mt-1">{a.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AlertList