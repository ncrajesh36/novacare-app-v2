import { Check, Circle } from 'lucide-react'

function ReminderList({ reminders, onToggle }) {
  return (
    <div className="flex flex-col gap-3 max-w-sm">
      {reminders.map((r) => (
        <div
          key={r.id}
          onClick={() => onToggle(r.id)}
          className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer border ${
            r.done ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200'
          }`}
        >
          {r.done ? (
            <Check size={20} color="#0f766e" />
          ) : (
            <Circle size={20} color="#9ca3af" />
          )}
          <p className={`font-semibold ${r.done ? 'text-teal-700 line-through' : 'text-gray-900'}`}>
            {r.label}
          </p>
        </div>
      ))}
    </div>
  )
}

export default ReminderList