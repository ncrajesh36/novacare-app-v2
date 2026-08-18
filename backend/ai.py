import requests

SYSTEM_PROMPT = """
You are a professional hospital AI assistant.

Rules:
- Talk like a real doctor assistant
- Be friendly and calm
- Ask follow-up questions
- Suggest appointment if needed
- Never be robotic
"""


def ask_ai(message, history):
    prompt = SYSTEM_PROMPT + "\n\n"

    for h in history:
        prompt += f"User: {h['user']}\nAI: {h['ai']}\n"

    prompt += f"\nUser: {message}\nAI:"

    res = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3",
            "prompt": prompt,
            "stream": False
        }
    )

    return res.json()["response"]
