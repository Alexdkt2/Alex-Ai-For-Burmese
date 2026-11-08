
const $ = (selector) => document.querySelector(selector);

// ==========================================
// 1. CV MAKER
// ==========================================

const cvForm = $("#cv-form");
const cvPreview = $("#cv-preview");
const templateSelect = $("#cv-template");
const photoInput = $("#cv-photo");
const photoContainer = $("#cv-photo-container");
const photoPreview = $("#cv-photo-preview");
const removePhotoButton = $("#remove-cv-photo");

function safe(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function updateCV() {
  if (!cvForm || !cvPreview) return;

  const data = Object.fromEntries(new FormData(cvForm).entries());

  const paragraph = (value, fallback) =>
    `<p>${safe(value).replace(/\n/g, "<br>") || fallback}</p>`;

  const photo = photoContainer;

  cvPreview.innerHTML = `
    <h1>${safe(data.name) || "Your Name"}</h1>
    <h3>${safe(data.headline) || "Professional title"}</h3>

    <p class="cv-contact">
      ${[data.phone, data.email, data.location]
        .filter(Boolean)
        .map(safe)
        .join(" · ")}
    </p>

    <hr>

    <h4>PROFILE</h4>
    ${paragraph(data.summary, "Add a professional summary.")}

    <h4>WORK EXPERIENCE</h4>
    ${paragraph(data.experience, "Add your work experience.")}

    <h4>SKILLS</h4>
    ${paragraph(data.skills, "Add your skills.")}

    <h4>EDUCATION</h4>
    ${paragraph(data.education, "Add your education.")}

    <h4>LANGUAGES</h4>
    ${paragraph(data.languages, "Add your languages.")}
  `;

  // Keep uploaded photo when preview updates
  if (photo) {
    cvPreview.prepend(photo);
  }
}

// Update CV when form is submitted
if (cvForm) {
  cvForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateCV();
  });

  cvForm.addEventListener("input", updateCV);
  cvForm.addEventListener("change", updateCV);
}

// Change CV template
if (templateSelect && cvPreview) {
  templateSelect.addEventListener("change", () => {
    cvPreview.classList.remove(
      "template-modern",
      "template-classic",
      "template-professional"
    );

    cvPreview.classList.add(
      "template-" + templateSelect.value
    );
  });
}

// Upload profile photo
if (photoInput && photoPreview && photoContainer) {
  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      photoInput.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      photoPreview.src = event.target.result;
      photoContainer.hidden = false;
    };

    reader.readAsDataURL(file);
  });
}

// Remove profile photo
if (removePhotoButton) {
  removePhotoButton.addEventListener("click", () => {
    if (photoInput) photoInput.value = "";
    if (photoPreview) photoPreview.removeAttribute("src");
    if (photoContainer) photoContainer.hidden = true;
  });
}

// Print / Save PDF
const printButton = $("#print-cv");

if (printButton) {
  printButton.addEventListener("click", () => {
    updateCV();
    window.print();
  });
}

updateCV();

// ==========================================
// 2. VOICE TRANSLATOR
// ==========================================

const sourceLang = $("#source-lang");
const targetLang = $("#target-lang");
const speechInput = $("#speech-input");
const translationOutput = $("#translation-output");
const speechStatus = $("#speech-status");

const languageNames = {
  "my": "Burmese",
  "my-MM": "Burmese",
  "en": "English",
  "en-US": "English",
  "en-GB": "English",
  "th": "Thai",
  "th-TH": "Thai",
  "ru": "Russian",
  "ru-RU": "Russian",
  "zh-CN": "Chinese",
  "ja-JP": "Japanese",
  "ko-KR": "Korean",
  "hi-IN": "Hindi",
  "ne-NP": "Nepali",
  "fr-FR": "French",
  "de-DE": "German",
  "es-ES": "Spanish",
  "ar-SA": "Arabic"
};

function languageCode(value) {
  return String(value || "en").split("-")[0];
}

function setStatus(message) {
  if (speechStatus) speechStatus.textContent = message;
}

// Swap translation languages
const swapButton = $("#swap-languages");

if (swapButton && sourceLang && targetLang) {
  swapButton.addEventListener("click", () => {
    const oldSource = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = oldSource;
  });
}

// Speech recognition
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setStatus("Listening...");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;

    if (speechInput) {
      speechInput.value = transcript;
    }

    setStatus("Speech captured.");
  };

  recognition.onerror = (event) => {
    setStatus("Microphone error: " + event.error);
  };

  recognition.onend = () => {
    if (speechStatus && speechStatus.textContent === "Listening...") {
      setStatus("Listening stopped.");
    }
  };
} else {
  setStatus("Speech recognition is not supported by this browser.");
}

// Start listening
const startButton = $("#start-listening");

if (startButton) {
  startButton.addEventListener("click", () => {
    if (!recognition) {
      alert("Please use a browser that supports speech recognition.");
      return;
    }

    recognition.lang = sourceLang?.value || "en-US";

    try {
      recognition.start();
    } catch (error) {
      setStatus("Please try again.");
    }
  });
}

// Stop listening
const stopButton = $("#stop-listening");

if (stopButton) {
  stopButton.addEventListener("click", () => {
    if (recognition) recognition.stop();
    setStatus("Listening stopped.");
  });
}

// Translate text using MyMemory
const translateButton = $("#translate-text");

if (translateButton) {
  translateButton.addEventListener("click", async () => {
    const text = speechInput?.value.trim();

    if (!text) {
      alert("Please enter or speak some text first.");
      return;
    }

    const from = languageCode(sourceLang?.value);
    const to = languageCode(targetLang?.value);

    if (from === to) {
      alert("Please select two different languages.");
      return;
    }

    translationOutput.textContent = "Translating...";
    setStatus("Translating...");

    try {
      const url =
        "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(text) +
        "&langpair=" +
        encodeURIComponent(from + "|" + to);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Translation service unavailable.");
      }

      const result = await response.json();

      if (result.responseStatus !== 200) {
        throw new Error(
          result.responseDetails || "Translation failed."
        );
      }

      translationOutput.textContent =
        result.responseData.translatedText;

      setStatus("Translation complete.");
    } catch (error) {
      translationOutput.textContent =
        "Translation failed. Please try again.";

      setStatus(error.message);
    }
  });
}

// Speak translated text
const speakButton = $("#speak-result");

if (speakButton) {
  speakButton.addEventListener("click", () => {
    const text = translationOutput?.textContent.trim();

    if (!text || text === "Translating...") return;

    if (!("speechSynthesis" in window)) {
      alert("Speech output is not supported.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang?.value || "en-US";

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

// Copy translated text
const copyButton = $("#copy-result");

if (copyButton) {
  copyButton.addEventListener("click", async () => {
    const text = translationOutput?.textContent.trim();

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setStatus("Translation copied.");
    } catch (error) {
      setStatus("Could not copy text.");
    }
  });
}

// ==========================================
// 3. THAILAND JOB FINDER
// ==========================================

const jobKeyword = $("#job-keyword");
const jobProvince = $("#job-province");
const jobLanguage = $("#job-language");
const searchJobsButton = $("#search-jobs");

function searchThailandJobs(keyword) {
  const province = jobProvince?.value || "Thailand";
  const language = jobLanguage?.value || "";

  const searchText = [
    keyword || jobKeyword?.value || "Hotel jobs",
    province,
    language,
    "job vacancy"
  ].filter(Boolean).join(" ");

  const encoded = encodeURIComponent(searchText);

  const urls = [
    "https://www.google.com/search?q=" + encoded +
      "+site%3Ajobthai.com",

    "https://www.google.com/search?q=" + encoded +
      "+site%3Ajobsdb.com",

    "https://www.google.com/search?q=" + encoded +
      "+site%3Aindeed.com",

    "https://www.google.com/search?q=" + encoded +
      "+site%3Atopgun.co.th",

    "https://www.google.com/search?q=" + encoded
  ];

  urls.forEach((url) => {
    window.open(url, "_blank", "noopener");
  });
}

// Search button
if (searchJobsButton) {
  searchJobsButton.addEventListener("click", () => {
    searchThailandJobs();
  });
}

// Quick keyword buttons
document.querySelectorAll("[data-keyword]").forEach((button) => {
  button.addEventListener("click", () => {
    const keyword = button.dataset.keyword;

    if (jobKeyword) {
      jobKeyword.value = keyword;
    }

    searchThailandJobs(keyword);
  });
});
