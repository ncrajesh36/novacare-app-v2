import { useState } from 'react'
import { Camera, Loader2, CheckCircle2 } from 'lucide-react'
import { api } from './apiClient'

function Capture({ onCaptured }) {
  const [stage, setStage] = useState('idle') // idle | working | done
  const [reading, setReading] = useState(null)

  const startCapture = async () => {
    setStage('working')

    // Demo sample reading — not from a camera/OCR yet.
    await new Promise((r) => setTimeout(r, 900))
    const sys = 118 + Math.floor(Math.random() * 20)
    const dia = 74 + Math.floor(Math.random() * 12)

    try {
      await api('/api/captures', {
        method: 'POST',
        body: JSON.stringify({ systolic: sys, diastolic: dia }),
      })
    } catch {
      // Still show the demo reading locally if the API is offline.
    }

    setReading({ sys, dia })
    setStage('done')
    onCaptured(`Demo BP sample logged: ${sys}/${dia} mmHg`)
  }

  const reset = () => {
    setStage('idle')
    setReading(null)
  }

  return (
    <div className="max-w-sm">
      {stage === 'idle' && (
        <div className="space-y-3">
          <button
            onClick={startCapture}
            className="w-full flex items-center gap-3 p-5 rounded-2xl bg-teal-50 border border-teal-100"
          >
            <Camera size={26} color="#0f766e" />
            <span className="font-semibold text-teal-700">Log a demo reading</span>
          </button>
          <p className="text-xs text-gray-500 px-1">
            Sample data for now — this does not read a real photo or cuff yet.
          </p>
        </div>
      )}

      {stage === 'working' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 size={28} color="#0f766e" className="animate-spin" />
          <p className="text-sm text-gray-500">Saving sample reading…</p>
        </div>
      )}

      {stage === 'done' && reading && (
        <div className="p-5 rounded-2xl bg-teal-50 border border-teal-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} color="#0f766e" />
            <span className="text-sm font-semibold text-teal-700">Demo sample saved</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {reading.sys}/{reading.dia} <span className="text-sm font-normal text-gray-500">mmHg</span>
          </p>
          <button
            onClick={reset}
            className="mt-4 w-full py-2 rounded-full bg-teal-600 text-white text-sm font-semibold"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

export default Capture
