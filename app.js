
/* =========================================
   ALEX AI TOOLS — FREE VERSION 1.1
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

function getTargetCode() {
  return targetLang?.value || "th";
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
    // Recognition may already be stopped.
  }
}

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

function speakTranslation(text) {
  return new Promise((resolve) => {
    if (!text || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const targetCode = getTargetCode();
    const voiceMap = {
      th: "th-TH",
      my: "my-MM",
      en: "en-US",
      ru: "ru-RU",
      zh: "zh-CN",
      ja: "ja-JP",
      ko: "ko-KR"
    };

    utterance.lang =
      voiceMap[targetCode] || speechVoiceMap[targetCode] || "en-US";

    const voices = speechSynthesis.getVoices();

    const selectedVoice = voices.find(voice =>
      voice.lang.toLowerCase() === utterance.lang.toLowerCase()
    );

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
      speaking = true;
      setSpeechStatus("🔊 Speaking translation...");
    };

    utterance.onend = () => {
      speaking = false;
      resolve();
    };

    utterance.onerror = () => {
      speaking = false;
      setSpeechStatus("Voice playback error");
      resolve();
    };

    speechSynthesis.speak(utterance);
  });
}



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
      setSpeechStatus("Translation complete. Listening again...");
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
      restartTimer = setTimeout(startRecognition, 500);
    }
  }
}


/* =========================================
   SPEECH RECOGNITION
   ========================================= */

if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  // One speech turn at a time.
  // This helps prevent the microphone from hearing
  // the translated voice coming from the speaker.

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
      speechInput.value =
        (speechInput.value || "") + interimText;
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

swapLanguages?.addEventListener("click", () => {
  if (!sourceLang || !targetLang) return;

  if (autoMode) {
    stopAutomaticMode();
  }

  const oldSource = sourceLang.value;
  const oldTarget = targetLang.value;

  sourceLang.value =
    speechVoiceMap[oldTarget] || "en-US";

  targetLang.value =
    languageMap[oldSource] || "en";

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

console.log("Alex AI Tools Free Version 1.1 loaded.");
