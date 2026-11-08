
/* =========================================
   ALEX AI TOOLS — FREE VERSION 1.0
   COMPLETE APP.JS
   ========================================= */

const $ = (selector) => document.querySelector(selector);

/* =========================================
   1. WORKSPACE NAVIGATION
   ========================================= */

const workspace = $("#workspace");
const workspaceTitle = $("#workspace-title");

const toolPanels = {
  cv: { element: $("#panel-cv"), title: "CV Maker" },
  voice: { element: $("#panel-voice"), title: "Voice Translator" },
  jobs: { element: $("#panel-jobs"), title: "Thailand Job Finder" }
};

function openTool(name) {
  const selected = toolPanels[name];
  if (!selected || !workspace) return;

  Object.values(toolPanels).forEach((panel) => {
    if (panel.element) panel.element.hidden = true;
  });

  selected.element.hidden = false;
  workspaceTitle.textContent = selected.title;
  workspace.hidden = false;

  workspace.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  if (name === "cv") updateCV();
}

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => openTool(button.dataset.open));
});

$("#close-workspace")?.addEventListener("click", () => {
  workspace.hidden = true;
  Object.values(toolPanels).forEach((panel) => {
    if (panel.element) panel.element.hidden = true;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
});


/* =========================================
   2. CV MAKER
   ========================================= */

const cvForm = $("#cv-form");
const cvPreview = $("#cv-preview");
const cvTemplate = $("#cv-template");
const cvPhoto = $("#cv-photo");
const removePhotoButton = $("#remove-cv-photo");
const printCVButton = $("#print-cv");

let uploadedPhoto = "";

function getCVValue(name) {
  return cvForm?.elements.namedItem(name)?.value.trim() || "";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function formatCVText(value) {
  return escapeHTML(value).replace(/\n/g, "<br>");
}

function updateCV() {
  if (!cvForm || !cvPreview) return;

  const name = getCVValue("name") || "Your Name";
  const headline = getCVValue("headline");
  const location = getCVValue("location");
  const phone = getCVValue("phone");
  const email = getCVValue("email");

  const sections = [
    ["Professional Summary", getCVValue("summary")],
    ["Work Experience", getCVValue("experience")],
    ["Skills", getCVValue("skills")],
    ["Education", getCVValue("education")],
    ["Languages", getCVValue("languages")]
  ];

  cvPreview.className =
    "cv-paper template-" + (cvTemplate?.value || "modern");

  cvPreview.innerHTML = `
    <div class="cv-header">
      ${uploadedPhoto
        ? `<img class="cv-preview-photo" src="${uploadedPhoto}" alt="Profile photo">`
        : ""}
      <div>
        <h1>${escapeHTML(name)}</h1>
        <h3>${escapeHTML(headline)}</h3>
        <p>${escapeHTML(location)}</p>
        <p>${escapeHTML(phone)}</p>
        <p>${escapeHTML(email)}</p>
      </div>
    </div>
    ${sections.map(([title, content]) => `
      <section>
        <h2>${title}</h2>
        <p>${formatCVText(content || "Not provided")}</p>
      </section>
    `).join("")}
  `;
}

cvForm?.addEventListener("input", updateCV);
cvForm?.addEventListener("change", updateCV);
cvTemplate?.addEventListener("change", updateCV);

cvPhoto?.addEventListener("change", () => {
  const file = cvPhoto.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Please select a photo smaller than 5 MB.");
    cvPhoto.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    uploadedPhoto = reader.result;
    updateCV();
  };

  reader.readAsDataURL(file);
});

removePhotoButton?.addEventListener("click", () => {
  uploadedPhoto = "";
  if (cvPhoto) cvPhoto.value = "";
  updateCV();
});

cvForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  updateCV();
});

printCVButton?.addEventListener("click", () => {
  updateCV();
  window.print();
});

updateCV();


/* =========================================
   3. TWO-WAY AUTOMATIC VOICE TRANSLATOR
   ========================================= */

const sourceLang = $("#source-lang");
const targetLang = $("#target-lang");

const startListening = $("#start-listening");
const stopListening = $("#stop-listening");

const speechStatus = $("#speech-status");
const speechInput = $("#speech-input");
const translationOutput = $("#translation-output");

const translateButton = $("#translate-text");
const speakButton = $("#speak-result");
const copyButton = $("#copy-result");
const swapLanguages = $("#swap-languages");

const languageMap = {
  "my-MM": "my",
  "en-US": "en",
  "th-TH": "th",
  "ru-RU": "ru",
  "zh-CN": "zh",
  "hi-IN": "hi",
  "ne-NP": "ne",
  "ja-JP": "ja",
  "ko-KR": "ko",
  "fr-FR": "fr",
  "de-DE": "de",
  "es-ES": "es"
};

const speechVoiceMap = {
  my: "my-MM",
  en: "en-US",
  th: "th-TH",
  ru: "ru-RU",
  zh: "zh-CN",
  hi: "hi-IN",
  ne: "ne-NP",
  ja: "ja-JP",
  ko: "ko-KR",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES"
};

let recognition = null;
let listening = false;
let autoMode = false;
let processing = false;
let translationTimer = null;
let lastTranslatedText = "";
let speechSession = 0;

function setSpeechStatus(message) {
  if (speechStatus) speechStatus.textContent = message;
}

function getSourceCode() {
  return languageMap[sourceLang?.value] || "my";
}

function getTargetCode() {
  return targetLang?.value || "th";
}

function speakTranslation(text) {
  if (!text || !("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechVoiceMap[getTargetCode()] || "en-US";
  utterance.rate = 0.95;
  utterance.pitch = 1;

  speechSynthesis.speak(utterance);
}

async function translateText(autoSpeak = false) {
  const text = speechInput?.value.trim();

  if (!text) {
    if (!autoSpeak) alert("Please speak or enter some text.");
    return;
  }

  if (processing) return;

  const source = getSourceCode();
  const target = getTargetCode();

  if (source === target) {
    translationOutput.value = text;
    if (autoSpeak) speakTranslation(text);
    return;
  }

  processing = true;
  if (translateButton) translateButton.disabled = true;

  translationOutput.value = "Translating...";

  try {
    const url =
      "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(text) +
      "&langpair=" +
      encodeURIComponent(source + "|" + target);

    const response = await fetch(url);

    if (!response.ok) throw new Error("Translation service unavailable.");

    const data = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error("Translation failed. Please try again.");
    }

    const result = data.responseData?.translatedText;

    if (!result) throw new Error("No translation returned.");

    translationOutput.value = result;
    lastTranslatedText = text;

    if (autoSpeak && autoMode && listening) {
      speakTranslation(result);
    }

    setSpeechStatus(
      autoMode ? "Translation complete. Continue speaking..." : "Translation complete."
    );

  } catch (error) {
    translationOutput.value = "Translation error: " + error.message;
    setSpeechStatus("Translation failed. Check your internet connection.");
  } finally {
    processing = false;
    if (translateButton) translateButton.disabled = false;
  }
}


/* Speech recognition */

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    listening = true;

    if (startListening) startListening.disabled = true;
    if (stopListening) stopListening.disabled = false;

    setSpeechStatus("🎙 Listening... Speak now.");
  };

  recognition.onresult = (event) => {
    let finalText = "";

    for (let i = 0; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalText += event.results[i][0].transcript + " ";
      }
    }

    if (finalText.trim()) {
      speechInput.value = finalText.trim();

      if (autoMode) {
        clearTimeout(translationTimer);

        translationTimer = setTimeout(() => {
          if (!processing && listening) {
            translateText(true);
          }
        }, 1000);
      }
    }
  };

  recognition.onerror = (event) => {
    setSpeechStatus("Microphone: " + event.error);

    if (event.error === "not-allowed" ||
        event.error === "service-not-allowed") {
      stopAutomaticMode();
      alert("Please allow microphone access in your browser.");
    }
  };

  recognition.onend = () => {
    if (listening && autoMode) {
      try {
        recognition.start();
      } catch (error) {
        setSpeechStatus("Restarting microphone...");
      }
    } else {
      if (startListening) startListening.disabled = false;
      if (stopListening) stopListening.disabled = true;
      setSpeechStatus("Listening stopped.");
    }
  };

} else {
  setSpeechStatus(
    "Speech recognition is not supported. Try Chrome on Android."
  );
}

function startAutomaticMode() {
  if (!recognition) {
    alert("Use Google Chrome on Android with microphone permission.");
    return;
  }

  if (getSourceCode() === getTargetCode()) {
    alert("Please select two different languages.");
    return;
  }

  autoMode = true;
  listening = true;
  speechSession++;

  speechInput.value = "";
  translationOutput.value = "";
  lastTranslatedText = "";

  recognition.lang = sourceLang.value;

  setSpeechStatus("Starting automatic conversation...");

  try {
    recognition.start();
  } catch (error) {
    listening = false;
    autoMode = false;
    setSpeechStatus("Could not start microphone. Try again.");
  }
}

function stopAutomaticMode() {
  autoMode = false;
  listening = false;

  clearTimeout(translationTimer);

  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {
      // Already stopped.
    }
  }

  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }

  if (startListening) startListening.disabled = false;
  if (stopListening) stopListening.disabled = true;

  setSpeechStatus("Conversation stopped.");
}

startListening?.addEventListener("click", startAutomaticMode);
stopListening?.addEventListener("click", stopAutomaticMode);

translateButton?.addEventListener("click", () => {
  translateText(false);
});

speakButton?.addEventListener("click", () => {
  speakTranslation(translationOutput?.value.trim());
});

swapLanguages?.addEventListener("click", () => {
  if (!sourceLang || !targetLang) return;

  const oldSource = sourceLang.value;
  const oldTarget = targetLang.value;

  sourceLang.value = speechVoiceMap[targetLang.value] || "en-US";
  targetLang.value = languageMap[oldSource] || "en";

  if (listening) {
    stopAutomaticMode();
    setSpeechStatus("Languages changed. Press Start speaking.");
  }
});

[sourceLang, targetLang].forEach((select) => {
  select?.addEventListener("change", () => {
    if (listening) stopAutomaticMode();
  });
});

copyButton?.addEventListener("click", async () => {
  const text = translationOutput?.value || "";
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    alert("Translation copied.");
  } catch {
    translationOutput.select();
    alert("Select and copy the translation manually.");
  }
});


/* =========================================
   4. THAILAND JOB FINDER
   ========================================= */

const jobKeyword = $("#job-keyword");
const jobProvince = $("#job-province");
const jobLanguage = $("#job-language");
const searchJobs = $("#search-jobs");

function searchThailandJobs(keyword) {
  const province = jobProvince?.value || "Thailand";

  const languageValue = jobLanguage?.value || "both";

  const languageText = {
    both: "Thai English",
    en: "English",
    th: "Thai"
  };

  const query = [
    keyword,
    province,
    languageText[languageValue] || "Thai English",
    "job vacancy hiring"
  ].join(" ");

  window.open(
    "https://www.google.com/search?q=" + encodeURIComponent(query),
    "_blank",
    "noopener,noreferrer"
  );
}

searchJobs?.addEventListener("click", () => {
  searchThailandJobs(jobKeyword?.value.trim() || "hotel jobs");
});

document.querySelectorAll("[data-keyword]").forEach((button) => {
  button.addEventListener("click", () => {
    const keyword = button.dataset.keyword;
    if (jobKeyword) jobKeyword.value = keyword;
    searchThailandJobs(keyword);
  });
});


/* =========================================
   5. APP READY
   ========================================= */

console.log("Alex AI Tools Free Version 1.0 loaded.");
