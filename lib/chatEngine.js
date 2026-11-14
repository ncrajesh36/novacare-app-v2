import { MAX_SESSIONS } from './defaults.js'

const sessions = new Map()

function pruneSessions() {
  if (sessions.size <= MAX_SESSIONS) return
  const oldest = [...sessions.keys()].slice(0, sessions.size - MAX_SESSIONS)
  for (const key of oldest) sessions.delete(key)
}

function detectIntent(msg) {
  const text = msg.toLowerCase().trim()
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening']
  const thanks = ['thanks', 'thank you', 'thx']
  const symptomKeywords = [
    'fever', 'headache', 'cough', 'diarrhea', 'pain', 'cold', 'flu', 'migraine',
    'stomach', 'rash', 'skin', 'chest', 'breath', 'sick', 'hurt', 'ache', 'nausea', 'dizzy',
  ]

  if (greetings.some((word) => text.includes(word)) && text.split(/\s+/).length <= 4) {
    return 'greeting'
  }
  if (thanks.some((word) => text.includes(word))) return 'thanks'
  if (text.includes('book') || text.includes('appointment')) return 'booking'
  if (symptomKeywords.some((word) => text.includes(word))) return 'symptom'
  return 'unknown'
}

function getCause(msg) {
  const m = msg.toLowerCase()
  if (m.includes('fever')) return 'Possible causes: viral infection, flu, or bacterial infection.'
  if (m.includes('headache')) return 'Possible causes: stress, dehydration, migraine, or eye strain.'
  if (m.includes('cough')) return 'Possible causes: cold, allergy, or respiratory infection.'
  if (m.includes('diarrhea')) return 'Possible causes: food infection or stomach virus.'
  return 'Symptoms noted.'
}

function recommendDoctor(msg) {
  const m = msg.toLowerCase()
  if (['fever', 'cold', 'flu'].some((word) => m.includes(word))) return 'General Physician'
  if (['headache', 'migraine'].some((word) => m.includes(word))) return 'Neurologist'
  if (['stomach', 'diarrhea'].some((word) => m.includes(word))) return 'Gastroenterologist'
  if (['skin', 'rash'].some((word) => m.includes(word))) return 'Dermatologist'
  if (['chest', 'breath'].some((word) => m.includes(word))) return 'Cardiologist / Pulmonologist'
  return 'General Physician'
}

export function processChat(sessionKey, message) {
  pruneSessions()
  const state = sessions.get(sessionKey) ?? {
    step: 'idle',
    symptoms: '',
    doctor: '',
    booked: false,
  }
  sessions.set(sessionKey, state)

  const msg = message.trim()
  const intent = detectIntent(msg)

  if (intent === 'thanks') {
    return { reply: "😊 You're welcome! Take care and stay healthy.", appointment: null }
  }

  if (intent === 'greeting') {
    state.step = 'idle'
    return { reply: '👋 Hello! Please describe your symptoms so I can help you.', appointment: null }
  }

  if (state.booked) {
    return {
      reply: '👍 Your appointment is already confirmed. If you need anything else, let me know.',
      appointment: null,
    }
  }

  if (state.step === 'confirm') {
    const lower = msg.toLowerCase()
    if (lower.includes('yes')) {
      state.step = 'done'
      state.booked = true
      return {
        reply: '🎉 Appointment confirmed successfully! A doctor will contact you soon.',
        appointment: { symptoms: state.symptoms, doctor: state.doctor, status: 'confirmed' },
      }
    }
    if (lower.includes('no')) {
      state.step = 'idle'
      const cleared = { symptoms: state.symptoms, doctor: state.doctor }
      state.symptoms = ''
      state.doctor = ''
      return {
        reply: '❌ Booking cancelled. You can describe your symptoms again.',
        appointment: { ...cleared, status: 'cancelled' },
      }
    }
    return { reply: "Please reply with 'yes' or 'no' to confirm appointment.", appointment: null }
  }

  if (intent === 'unknown' && state.step === 'idle' && ![...msg].some((c) => /[a-zA-Z]/.test(c))) {
    return { reply: 'Please describe your symptoms so I can assist you.', appointment: null }
  }

  const cause = getCause(msg)
  const doctor = recommendDoctor(msg)
  state.symptoms = msg
  state.doctor = doctor
  state.step = 'confirm'
  return {
    reply:
      `\n🧠 ${cause}` +
      `\n\n🏥 Recommended Doctor: ${doctor}` +
      `\n\n👉 Do you want to book an appointment? (yes/no)\n`,
    appointment: null,
  }
}
