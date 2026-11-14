const $ = (id) => document.getElementById(id);
const HISTORY_KEY = "alexGurdChatV2";
let history = loadHistory();
let recognition = null;
let isBusy = false;

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(item => item && ["user", "assistant"].includes(item.role) && typeof item.text === "string").slice(-30) : [];
  } catch { return []; }
}
function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-30))); } catch {}
}
function addMessage(role, text, save = true) {
  const wrap = document.createElement("div");
  wrap.className = "message " + (role === "user" ? "user" : "assistant");
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "user" ? "You" : "Alex's Gurd";
  wrap.append(bubble, label);
  $("chatMessages").appendChild(wrap);
  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
  if (save) {
    history.push({ role, text });
    history = history.slice(-30);
    saveHistory();
  }
  return bubble;
}
function renderHistory() {
  if (!history.length) return;
  $("chatMessages").innerHTML = "";
  history.forEach(item => addMessage(item.role, item.text, false));
}
function setBusy(value) {
  isBusy = value;
  $("sendButton").disabled = value;
  $("sendButton").textContent = value ? "Thinking…" : "Send";
}
async function sendMessage(text) {
  const clean = text.trim();
  if (!clean || isBusy) return;
  $("errorBox").hidden = true;
  $("userMessage").value = "";
  addMessage("user", clean);
  setBusy(true);
  const pending = addMessage("assistant", "Thinking…", false);
  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-gurd-access-code": $("accessCode").value.trim() },
      body: JSON.stringify({
        message: clean,
        mode: $("assistantMode").value,
        language: $("replyLanguage").value,
        history: history.slice(0, -1).slice(-8)
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Assistant service is not available.");
    if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("The assistant returned an empty reply.");
    pending.textContent = data.reply;
    history.push({ role: "assistant", text: data.reply });
    history = history.slice(-30);
    saveHistory();
  } catch (error) {
    pending.textContent = "I couldn't complete that request.";
    $("errorBox").textContent = error.message;
    $("errorBox").hidden = false;
  } finally {
    setBusy(false);
    $("userMessage").focus();
  }
}
$("chatForm").addEventListener("submit", event => {
  event.preventDefault();
  sendMessage($("userMessage").value);
});
document.querySelectorAll(".quick-action").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.mode) $("assistantMode").value = button.dataset.mode;
    sendMessage(button.dataset.prompt || "");
  });
});
$("clearChat").addEventListener("click", () => {
  if (!confirm("Clear this device's saved chat history?")) return;
  history = [];
  saveHistory();
  $("chatMessages").innerHTML = "";
  addMessage("assistant", "Chat history cleared. ဘာကူညီပေးရမလဲ?");
});
$("voiceButton").addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    $("voiceStatus").textContent = "Voice input is not supported here. Please type your message.";
    return;
  }
  if (recognition) { try { recognition.stop(); } catch {} }
  recognition = new SpeechRecognition();
  const language = $("replyLanguage").value;
  recognition.lang = ({ my: "my-MM", th: "th-TH", en: "en-US", auto: "en-US" })[language] || "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;
  $("voiceStatus").textContent = "Listening…";
  recognition.onresult = event => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    $("userMessage").value = transcript;
    $("voiceStatus").textContent = transcript ? "Speech captured. Press Send." : "No speech detected.";
  };
  recognition.onerror = () => { $("voiceStatus").textContent = "Microphone error. Check browser permission."; };
  recognition.onend = () => {
    if ($("voiceStatus").textContent === "Listening…") $("voiceStatus").textContent = "Ready";
  };
  try { recognition.start(); } catch { $("voiceStatus").textContent = "Could not start microphone."; }
});
function speak(text) {
  if (!("speechSynthesis" in window)) {
    $("voiceStatus").textContent = "Voice playback is not supported in this browser.";
    return;
  }
  const language = $("replyLanguage").value;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = ({ my: "my-MM", th: "th-TH", en: "en-US", auto: "en-US" })[language] || "en-US";
  utterance.rate = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}
$("chatMessages").addEventListener("click", event => {
  const bubble = event.target.closest(".bubble");
  if (bubble && !bubble.closest(".user")) speak(bubble.textContent);
});
async function checkConnection() {
  try {
    const response = await fetch("/api/assistant", { method: "GET" });
    const data = await response.json();
    $("connectionStatus").textContent = data.configured ? "AI service and private access configured" : "Setup needed: configure Cloudflare secrets";
  } catch { $("connectionStatus").textContent = "AI service status unavailable"; }
}
renderHistory();
checkConnection();