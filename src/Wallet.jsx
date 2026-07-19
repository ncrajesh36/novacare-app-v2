import { useState } from 'react'
import { Wallet as WalletIcon, ArrowUpRight } from 'lucide-react'

function Wallet({ balance, onTopup }) {
  const [showPicker, setShowPicker] = useState(false)
  const [amount, setAmount] = useState(50)

  const confirm = () => {
    onTopup(amount)
    setShowPicker(false)
  }

  return (
    <div className="max-w-sm">
      <div className="p-5 rounded-2xl bg-teal-900 text-white mb-4">
        <p className="text-xs text-teal-200">Wallet balance</p>
        <p className="text-3xl font-bold mt-1">${balance.toFixed(2)}</p>
      </div>

      {!showPicker ? (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-blue-500 text-white font-semibold text-sm"
        >
          <ArrowUpRight size={16} />
          Top up
        </button>
      ) : (
        <div className="p-4 rounded-2xl border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-3">How much?</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[25, 50, 100, 200].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className={`py-2 rounded-full text-xs font-semibold ${
                  amount === v ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600'
                }`}
              >
                ${v}
              </button>
            ))}
          </div>
          <button
            onClick={confirm}
            className="w-full py-3 rounded-full bg-blue-500 text-white font-semibold text-sm"
          >
            Confirm ${amount}
          </button>
        </div>
      )}
    </div>
  )
}

export default Wallet