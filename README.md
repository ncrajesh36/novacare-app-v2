# NovaCare (novacare-app-v2)

Mobile-framed healthcare companion prototype: **Rosa** (patient) handles reminders, BP capture, and symptom chat; **Carlos** (sponsor) sees alerts and manages a wallet.

- Live UI: https://novacare-app-v2.vercel.app
- Chat API lives in sibling repo [`novacare-backend`](https://github.com/ncrajesh36/novacare-backend)

## Run the app

```bash
npm install
npm run dev
```

Vite serves the React UI (default `http://localhost:5173`).

### Chat backend (local)

```bash
# in novacare-backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Point `src/Chat.jsx` at `http://localhost:8000/chat` (it currently targets a Railway URL that may be down).

## Local overview dashboard

Static developer overview (architecture, screens, data flows, live API probes) — same idea as a Meen/MDM local overview:

```bash
cd overview
python3 -m http.server 8085
```

Open http://localhost:8085

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | Oxlint |

## Stack

- React 19 + Vite 8 + Tailwind CSS 4 + lucide-react
- FastAPI chat API (separate repo) with optional Ollama helpers under `backend/`
