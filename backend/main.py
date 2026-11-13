from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: dict[str, dict] = {}


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


def detect_intent(msg: str) -> str:
    text = msg.lower().strip()
    greetings = ("hi", "hello", "hey", "good morning", "good afternoon", "good evening")
    thanks = ("thanks", "thank you", "thx")
    symptom_keywords = (
        "fever",
        "headache",
        "cough",
        "diarrhea",
        "pain",
        "cold",
        "flu",
        "migraine",
        "stomach",
        "rash",
        "skin",
        "chest",
        "breath",
        "sick",
        "hurt",
        "ache",
        "nausea",
        "dizzy",
    )

    if any(word in text for word in greetings) and len(text.split()) <= 4:
        return "greeting"
    if any(word in text for word in thanks):
        return "thanks"
    if "book" in text or "appointment" in text:
        return "booking"
    if any(word in text for word in symptom_keywords):
        return "symptom"
    return "unknown"


def get_cause(msg: str) -> str:
    m = msg.lower()
    if "fever" in m:
        return "Possible causes: viral infection, flu, or bacterial infection."
    if "headache" in m:
        return "Possible causes: stress, dehydration, migraine, or eye strain."
    if "cough" in m:
        return "Possible causes: cold, allergy, or respiratory infection."
    if "diarrhea" in m:
        return "Possible causes: food infection or stomach virus."
    return "Symptoms noted."


def recommend_doctor(msg: str) -> str:
    m = msg.lower()
    if any(word in m for word in ("fever", "cold", "flu")):
        return "General Physician"
    if any(word in m for word in ("headache", "migraine")):
        return "Neurologist"
    if any(word in m for word in ("stomach", "diarrhea")):
        return "Gastroenterologist"
    if any(word in m for word in ("skin", "rash")):
        return "Dermatologist"
    if any(word in m for word in ("chest", "breath")):
        return "Cardiologist / Pulmonologist"
    return "General Physician"


def process(session_id: str, message: str) -> str:
    state = sessions.setdefault(
        session_id,
        {
            "step": "idle",
            "symptoms": "",
            "doctor": "",
            "booked": False,
        },
    )
    msg = message.strip()
    intent = detect_intent(msg)

    if intent == "thanks":
        return "😊 You're welcome! Take care and stay healthy."

    if intent == "greeting":
        state["step"] = "idle"
        return "👋 Hello! Please describe your symptoms so I can help you."

    if state.get("booked"):
        return "👍 Your appointment is already confirmed. If you need anything else, let me know."

    if state["step"] == "confirm":
        lower = msg.lower()
        if "yes" in lower:
            state["step"] = "done"
            state["booked"] = True
            return "🎉 Appointment confirmed successfully! A doctor will contact you soon."
        if "no" in lower:
            state["step"] = "idle"
            state["symptoms"] = ""
            state["doctor"] = ""
            return "❌ Booking cancelled. You can describe your symptoms again."
        return "Please reply with 'yes' or 'no' to confirm appointment."

    if intent in ("symptom", "booking", "unknown"):
        if intent == "unknown" and state["step"] == "idle" and not any(
            c.isalpha() for c in msg
        ):
            return "Please describe your symptoms so I can assist you."

        if intent == "unknown" and state["step"] == "idle":
            # Treat free-text descriptions as symptoms so chat stays useful
            pass

        cause = get_cause(msg)
        doctor = recommend_doctor(msg)
        state["symptoms"] = msg
        state["doctor"] = doctor
        state["step"] = "confirm"
        return (
            f"\n🧠 {cause}"
            f"\n\n🏥 Recommended Doctor: {doctor}"
            f"\n\n👉 Do you want to book an appointment? (yes/no)\n"
        )

    return "Please describe your symptoms so I can assist you."


@app.post("/chat")
def chat(req: ChatRequest):
    return {"reply": process(req.session_id, req.message)}


@app.get("/")
def root():
    return {"status": "Healthcare AI running"}
