const STORAGE_KEY = "novacare.overview.apiBase";

const apiBaseInput = document.getElementById("apiBase");
const btnProbe = document.getElementById("btnProbe");
const overallBanner = document.getElementById("overallBanner");
const overallText = document.getElementById("overallText");

function loadBase() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) apiBaseInput.value = saved;
}

function saveBase() {
  localStorage.setItem(STORAGE_KEY, apiBaseInput.value.trim());
}

function setPill(card, state, label) {
  const pill = card.querySelector("[data-pill]");
  pill.dataset.state = state;
  pill.textContent = label;
}

function setRaw(card, text) {
  card.querySelector(".raw").textContent = text;
}

function setOverall(state, text) {
  overallBanner.dataset.state = state;
  overallText.textContent = text;
}

async function probeJson(url, options) {
  const started = performance.now();
  const res = await fetch(url, options);
  const ms = Math.round(performance.now() - started);
  const text = await res.text();
  let body = text;
  try {
    body = JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    /* keep raw */
  }
  return { ok: res.ok, status: res.status, ms, body };
}

async function runProbes() {
  saveBase();
  const base = apiBaseInput.value.trim().replace(/\/$/, "");
  if (!base) {
    setOverall("bad", "Set a Chat API base URL first");
    return;
  }

  btnProbe.disabled = true;
  setOverall("unknown", "Probing…");

  const healthCard = document.querySelector('[data-id="health"]');
  const chatCard = document.querySelector('[data-id="chat"]');
  const uiCard = document.querySelector('[data-id="ui-hint"]');
  setPill(uiCard, "info", "info");

  let healthOk = false;
  let chatOk = false;

  setPill(healthCard, "unknown", "…");
  setRaw(healthCard, "Requesting…");
  try {
    const health = await probeJson(`${base}/`, { method: "GET" });
    healthOk = health.ok;
    setPill(healthCard, health.ok ? "ok" : "bad", health.ok ? "ok" : "fail");
    setRaw(healthCard, `HTTP ${health.status} · ${health.ms}ms\n${health.body}`);
  } catch (err) {
    setPill(healthCard, "bad", "fail");
    setRaw(healthCard, String(err.message || err));
  }

  setPill(chatCard, "unknown", "…");
  setRaw(chatCard, "Requesting…");
  try {
    const chat = await probeJson(`${base}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "hi", session_id: "local-overview" }),
    });
    chatOk = chat.ok;
    setPill(chatCard, chat.ok ? "ok" : "bad", chat.ok ? "ok" : "fail");
    setRaw(chatCard, `HTTP ${chat.status} · ${chat.ms}ms\n${chat.body}`);
  } catch (err) {
    setPill(chatCard, "bad", "fail");
    setRaw(
      chatCard,
      `${err.message || err}\n\nIf the UI and API are on different origins, ensure CORS allows this page.`,
    );
  }

  if (healthOk && chatOk) {
    setOverall("ok", "Backend health + chat OK");
  } else if (healthOk || chatOk) {
    setOverall("warn", "Partial — one probe failed (CORS or endpoint)");
  } else {
    setOverall("bad", "Backend unreachable — start uvicorn or fix the base URL");
  }

  btnProbe.disabled = false;
}

loadBase();
btnProbe.addEventListener("click", runProbes);
apiBaseInput.addEventListener("change", saveBase);
