import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

function Chat() {
  const [messages, setMessages] = useState([
    { from: 'ai', text: 'Hello! Please describe your symptoms so I can help you.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userText = input
    setMessages((prev) => [...prev, { from: 'user', text: userText }])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('web-production-65fd8.up.railway.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, session_id: 'rosa' }),
      })
      const data = await response.json()
      setMessages((prev) => [...prev, { from: 'ai', text: data.reply }])
    } catch (err) {
      setMessages((prev) => [...prev, { from: 'ai', text: 'Sorry, I could not reach the server.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-sm">
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`rounded-2xl px-3 py-2 max-w-[80%] text-sm whitespace-pre-line ${
                m.from === 'user' ? 'bg-blue-50 text-gray-900' : 'bg-teal-50 text-gray-900'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && <Loader2 size={18} className="animate-spin text-teal-600" />}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type how you feel…"
          className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-teal-400"
        />
        <button onClick={sendMessage} className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
          <Send size={16} color="#fff" />
        </button>
      </div>
    </div>
  )
}

export default Chat