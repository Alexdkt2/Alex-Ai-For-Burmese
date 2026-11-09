
/* =========================================
   ALEX AI TOOLS — FREE VERSION 1.2
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

  if (!selected.element) return;

  selected.element.hidden = false;

  if (workspaceTitle) {
    workspaceTitle.textContent = selected.title;
  }

  workspace.hidden = false;

  workspace.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  if (name === "cv") updateCV();
}

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    openTool(button.dataset.open);
  });
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
    cvPhoto.value = "";
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
   3. VOICE TRANSLATOR
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
let autoMode = false;
let recognitionActive = false;
let recognitionStarting = false;
let processing = false;
let speaking = false;
let restartTimer = null;
let currentTranscript = "";
let translationRequestId = 0;

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

function setSpeechStatus(message) {
  if (speechStatus) {
    speechStatus.textContent = message;
  }
}

function getSourceCode() {
  return languageMap[sourceLang?.value] || "my";
}

/* Always return the short target code */
function getTargetCode() {
  return languageMap[targetLang?.value] || "th";
}

function updateVoiceButtons() {
  if (startListening) {
    startListening.disabled = autoMode;
  }

  if (stopListening) {
    stopListening.disabled = !autoMode;
  }
}

function stopRecognition() {
  clearTimeout(restartTimer);

  if (!recognition) return;

  try {
    recognition.stop();
  } catch (error) {
    // Already stopped.
  }
}

/* =========================================
   MULTILINGUAL TEXT TO SPEECH
   ========================================= */

let voiceLoadPromise = null;

function loadSpeechVoices() {
  if (!("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }

  const available = speechSynthesis.getVoices();

  if (available.length) {
    return Promise.resolve(available);
  }

  if (voiceLoadPromise) return voiceLoadPromise;

  voiceLoadPromise = new Promise((resolve) => {
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;

      speechSynthesis.removeEventListener(
        "voiceschanged",
        onVoicesChanged
      );

      clearTimeout(timeout);
      voiceLoadPromise = null;

      resolve(speechSynthesis.getVoices());
    };

    const onVoicesChanged = () => {
      if (speechSynthesis.getVoices().length) {
        finish();
      }
    };

    const timeout = setTimeout(finish, 2500);

    speechSynthesis.addEventListener(
      "voiceschanged",
      onVoicesChanged
    );
  });

  return voiceLoadPromise;
}

function findLanguageVoice(voices, locale) {
  const requested = locale.toLowerCase();

  // Exact locale match first
  let voice = voices.find((item) =>
    item.lang.toLowerCase().replace("_", "-") === requested
  );

  if (voice) return voice;

  // Same language only, never another language
  const baseLanguage = requested.split("-")[0];

  voice = voices.find((item) =>
    item.lang.toLowerCase().replace("_", "-").split("-")[0]
      === baseLanguage
  );

  return voice || null;
}

async function speakTranslation(text) {
  if (!text || !("speechSynthesis" in window)) {
    setSpeechStatus("Text-to-speech is not supported.");
    return false;
  }

  speechSynthesis.cancel();

  const targetCode = getTargetCode();
  const targetLocale = speechVoiceMap[targetCode];

  if (!targetLocale) {
    setSpeechStatus("Unsupported voice language.");
    return false;
  }

  setSpeechStatus("Loading " + targetLocale + " voice...");

  const voices = await loadSpeechVoices();

  // Check language again in case selection changed
  if (targetCode !== getTargetCode()) {
    return false;
  }

  const selectedVoice = findLanguageVoice(
    voices,
    targetLocale
  );

  if (!selectedVoice) {
    speaking = false;

    setSpeechStatus(
      targetCode === "my"
        ? "Burmese voice unavailable. Install a Burmese TTS voice on Android."
        : "Voice unavailable: " + targetLocale
    );

    return false;
  }

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = selectedVoice.lang;
  utterance.voice = selectedVoice;
  utterance.rate = targetCode === "my" ? 0.85 : 0.9;
  utterance.pitch = 1;

  return new Promise((resolve) => {
    let completed = false;

    const finish = (success) => {
      if (completed) return;
      completed = true;
      speaking = false;
      resolve(success);
    };

    utterance.onstart = () => {
      speaking = true;
      setSpeechStatus("🔊 Speaking in " + targetLocale);
    };

    utterance.onend = () => {
      setSpeechStatus("Voice playback complete.");
      finish(true);
    };

    utterance.onerror = (event) => {
      setSpeechStatus(
        "Voice playback error: " + event.error
      );
      finish(false);
    };

    speaking = true;
    speechSynthesis.speak(utterance);
  });
}

/* =========================================
   TRANSLATION API
   ========================================= */

async function requestTranslation(text, source, target) {
  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(text) +
    "&langpair=" +
    encodeURIComponent(source + "|" + target);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Translation service unavailable.");
  }

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(
      data.responseDetails || "Translation failed."
    );
  }

  const result = data.responseData?.translatedText;

  if (!result) {
    throw new Error("No translation returned.");
  }

  return result;
}

async function translateText(autoSpeak = false) {
  const text = speechInput?.value.trim();

  if (!text) {
    if (!autoSpeak) {
      alert("Please enter or speak some text.");
    }
    return;
  }

  if (processing) return;

  const source = getSourceCode();
  const target = getTargetCode();

  if (source === target) {
    translationOutput.value = text;

    if (autoSpeak) {
      await speakTranslation(text);
    }

    return;
  }

  const requestId = ++translationRequestId;

  processing = true;

  if (translateButton) {
    translateButton.disabled = true;
  }

  translationOutput.value = "Translating...";

  if (autoSpeak) {
    stopRecognition();
    setSpeechStatus("Translating your speech...");
  }

  try {
    const result = await requestTranslation(
      text,
      source,
      target
    );

    if (requestId !== translationRequestId) return;

    translationOutput.value = result;

    if (autoSpeak && autoMode) {
      await speakTranslation(result);
    }

    if (autoMode) {
      setSpeechStatus("Translation complete.");
    } else {
      setSpeechStatus("Translation complete.");
    }

  } catch (error) {
    translationOutput.value =
      "Translation error: " + error.message;

    setSpeechStatus(
      "Translation failed. Check your internet connection."
    );

  } finally {
    processing = false;

    if (translateButton) {
      translateButton.disabled = false;
    }

    if (autoMode && !speaking) {
      restartTimer = setTimeout(startRecognition, 700);
    }
  }
}


/* =========================================
   SPEECH RECOGNITION
   ========================================= */

if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    recognitionActive = true;
    recognitionStarting = false;

    setSpeechStatus("🎙 Listening... Speak now.");
  };

  recognition.onresult = (event) => {
    let finalText = "";
    let interimText = "";

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {
      const result = event.results[i];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        finalText += transcript + " ";
      } else {
        interimText += transcript;
      }
    }

    if (speechInput && interimText) {
      speechInput.value = interimText;
    }

    if (finalText.trim()) {
      currentTranscript = finalText.trim();

      if (speechInput) {
        speechInput.value = currentTranscript;
      }

      setSpeechStatus("Speech detected. Preparing translation...");
    }
  };

  recognition.onerror = (event) => {
    recognitionStarting = false;

    if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {
      setSpeechStatus("Microphone permission denied.");
      stopAutomaticMode();

      alert(
        "Please allow microphone access in your browser settings."
      );

      return;
    }

    if (event.error === "no-speech") {
      setSpeechStatus("No speech detected. Listening again...");
    } else if (event.error !== "aborted") {
      setSpeechStatus("Microphone error: " + event.error);
    }
  };

  recognition.onend = () => {
    recognitionActive = false;
    recognitionStarting = false;

    const transcript = currentTranscript.trim();
    currentTranscript = "";

    if (!autoMode) {
      updateVoiceButtons();
      return;
    }

    if (transcript && !processing) {
      if (speechInput) {
        speechInput.value = transcript;
      }

      translateText(true);
      return;
    }

    if (!processing && !speaking) {
      restartTimer = setTimeout(startRecognition, 400);
    }
  };

} else {
  setSpeechStatus(
    "Speech recognition unavailable. Try Google Chrome on Android."
  );

  if (startListening) {
    startListening.disabled = true;
  }
}


/* =========================================
   START / STOP AUTOMATIC MODE
   ========================================= */

function startRecognition() {
  if (!autoMode || !recognition || processing || speaking) {
    return;
  }

  if (recognitionActive || recognitionStarting) {
    return;
  }

  recognition.lang = sourceLang.value;
  recognitionStarting = true;

  try {
    recognition.start();
  } catch (error) {
    recognitionStarting = false;

    restartTimer = setTimeout(() => {
      if (autoMode && !processing && !speaking) {
        startRecognition();
      }
    }, 800);
  }
}

function startAutomaticMode() {
  if (!recognition) {
    alert(
      "Please use Google Chrome on Android and allow microphone access."
    );
    return;
  }

  if (!sourceLang || !targetLang) return;

  if (getSourceCode() === getTargetCode()) {
    alert("Please select two different languages.");
    return;
  }

  if (autoMode) return;

  autoMode = true;
  processing = false;
  speaking = false;
  currentTranscript = "";

  speechInput.value = "";
  translationOutput.value = "";

  updateVoiceButtons();

  setSpeechStatus("Starting automatic conversation...");

  startRecognition();
}

function stopAutomaticMode() {
  autoMode = false;
  processing = false;
  speaking = false;
  currentTranscript = "";

  translationRequestId++;

  clearTimeout(restartTimer);

  stopRecognition();

  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }

  recognitionStarting = false;

  updateVoiceButtons();

  setSpeechStatus("Conversation stopped.");
}

startListening?.addEventListener(
  "click",
  startAutomaticMode
);

stopListening?.addEventListener(
  "click",
  stopAutomaticMode
);


/* =========================================
   MANUAL TRANSLATION
   ========================================= */

translateButton?.addEventListener("click", () => {
  translateText(false);
});

speakButton?.addEventListener("click", () => {
  const text = translationOutput?.value.trim();

  if (!text || text === "Translating...") return;

  speakTranslation(text);
});


/* =========================================
   SWAP LANGUAGES
   ========================================= */

swapLanguages?.addEventListener("click", () => {
  if (!sourceLang || !targetLang) return;

  if (autoMode) {
    stopAutomaticMode();
  }

  const oldSource = sourceLang.value;
  const oldTarget = targetLang.value;

  sourceLang.value = oldTarget;
  targetLang.value = oldSource;

  if (speechInput) speechInput.value = "";
  if (translationOutput) translationOutput.value = "";

  setSpeechStatus(
    "Languages swapped. Press Start to begin."
  );
});

[sourceLang, targetLang].forEach((select) => {
  select?.addEventListener("change", () => {
    if (autoMode) {
      stopAutomaticMode();
    }
  });
});


/* =========================================
   COPY TRANSLATION
   ========================================= */

copyButton?.addEventListener("click", async () => {
  const text = translationOutput?.value || "";

  if (!text || text === "Translating...") return;

  try {
    await navigator.clipboard.writeText(text);
    alert("Translation copied.");
  } catch (error) {
    translationOutput.select();
    alert("Please select and copy the translation manually.");
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
    "https://www.google.com/search?q=" +
    encodeURIComponent(query),
    "_blank",
    "noopener,noreferrer"
  );
}

searchJobs?.addEventListener("click", () => {
  searchThailandJobs(
    jobKeyword?.value.trim() || "hotel jobs"
  );
});

document.querySelectorAll("[data-keyword]").forEach((button) => {
  button.addEventListener("click", () => {
    const keyword = button.dataset.keyword;

    if (jobKeyword) {
      jobKeyword.value = keyword;
    }

    searchThailandJobs(keyword);
  });
});


/* =========================================
   5. APP READY
   ========================================= */

updateCV();
updateVoiceButtons();

if ("speechSynthesis" in window) {
  speechSynthesis.getVoices();

  speechSynthesis.addEventListener(
    "voiceschanged",
    () => {
      console.log(
        "Available speech voices:",
        speechSynthesis.getVoices().map(v => v.lang)
      );
    }
  );
}

console.log("Alex AI Tools Free Version 1.2 loaded.");
