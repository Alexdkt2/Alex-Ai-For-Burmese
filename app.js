
/* =========================================
   ALEX AI TOOLS — COMPLETE APP.JS
   ========================================= */

/* 1. WORKSPACE NAVIGATION */

const $ = (selector) => document.querySelector(selector);

const workspace = $("#workspace");
const workspaceTitle = $("#workspace-title");
const closeWorkspace = $("#close-workspace");

const toolPanels = {
  cv: {
    element: $("#panel-cv"),
    title: "CV Maker"
  },
  voice: {
    element: $("#panel-voice"),
    title: "Voice Translator"
  },
  jobs: {
    element: $("#panel-jobs"),
    title: "Thailand Job Finder"
  }
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
  button.addEventListener("click", () => {
    openTool(button.dataset.open);
  });
});

if (closeWorkspace) {
  closeWorkspace.addEventListener("click", () => {
    workspace.hidden = true;

    Object.values(toolPanels).forEach((panel) => {
      if (panel.element) panel.element.hidden = true;
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}


/* 2. CV MAKER */

const cvForm = $("#cv-form");
const cvPreview = $("#cv-preview");
const cvTemplate = $("#cv-template");
const cvPhoto = $("#cv-photo");
const cvPhotoPreview = $("#cv-photo-preview");
const photoContainer = $("#cv-photo-container");
const removePhotoButton = $("#remove-cv-photo");
const printCVButton = $("#print-cv");

let uploadedPhoto = "";

function getCVValue(name) {
  const field = cvForm?.elements.namedItem(name);
  return field ? field.value.trim() : "";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function updateCV() {
  if (!cvForm || !cvPreview) return;

  const name = getCVValue("name") || "Your Name";
  const phone = getCVValue("phone");
  const email = getCVValue("email");
  const location = getCVValue("location");
  const headline = getCVValue("headline");
  const summary = getCVValue("summary");
  const experience = getCVValue("experience");
  const skills = getCVValue("skills");
  const education = getCVValue("education");
  const languages = getCVValue("languages");

  const template = cvTemplate?.value || "modern";

  cvPreview.className = `cv-paper template-${template}`;

  cvPreview.innerHTML = `
    <div class="cv-header">
      <div>
        <h1>${escapeHTML(name)}</h1>
        <h3>${escapeHTML(headline)}</h3>
        <p>${escapeHTML(location)}</p>
        <p>${escapeHTML(phone)}</p>
        <p>${escapeHTML(email)}</p>
      </div>
    </div>

    <section>
      <h2>Professional Summary</h2>
      <p>${escapeHTML(summary)}</p>
    </section>

    <section>
      <h2>Work Experience</h2>
      <p>${escapeHTML(experience)}</p>
    </section>

    <section>
      <h2>Skills</h2>
      <p>${escapeHTML(skills)}</p>
    </section>

    <section>
      <h2>Education</h2>
      <p>${escapeHTML(education)}</p>
    </section>

    <section>
      <h2>Languages</h2>
      <p>${escapeHTML(languages)}</p>
    </section>
  `;

  if (uploadedPhoto) {
    const image = document.createElement("img");
    image.src = uploadedPhoto;
    image.alt = "CV Photo";
    image.className = "cv-preview-photo";
    cvPreview.querySelector(".cv-header").prepend(image);
  }
}

if (cvForm) {
  cvForm.addEventListener("input", updateCV);
  cvForm.addEventListener("change", updateCV);
}

if (cvTemplate) {
  cvTemplate.addEventListener("change", updateCV);
}

if (cvPhoto) {
  cvPhoto.addEventListener("change", () => {
    const file = cvPhoto.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      uploadedPhoto = reader.result;

      if (cvPhotoPreview) {
        cvPhotoPreview.src = uploadedPhoto;
      }

      if (photoContainer) {
        photoContainer.hidden = false;
      }

      updateCV();
    };

    reader.readAsDataURL(file);
  });
}

if (removePhotoButton) {
  removePhotoButton.addEventListener("click", () => {
    uploadedPhoto = "";

    if (cvPhoto) cvPhoto.value = "";
    if (cvPhotoPreview) cvPhotoPreview.src = "";
    if (photoContainer) photoContainer.hidden = true;

    updateCV();
  });
}

if (printCVButton) {
  printCVButton.addEventListener("click", () => {
    updateCV();
    window.print();
  });
}

updateCV();


/* 3. VOICE TRANSLATOR */

const sourceLang = $("#source-lang");
const targetLang = $("#target-lang");
const swapLanguages = $("#swap-languages");

const startListening = $("#start-listening");
const stopListening = $("#stop-listening");

const speechStatus = $("#speech-status");
const speechInput = $("#speech-input");

const translateButton = $("#translate-text");
const speakButton = $("#speak-result");
const copyButton = $("#copy-result");

const translationOutput = $("#translation-output");

let recognition = null;

function setSpeechStatus(message) {
  if (speechStatus) speechStatus.textContent = message;
}

if ("SpeechRecognition" in window ||
    "webkitSpeechRecognition" in window) {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let transcript = "";

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {
      transcript += event.results[i][0].transcript;
    }

    if (speechInput) {
      speechInput.value = transcript;
    }
  };

  recognition.onstart = () => {
    setSpeechStatus("Listening...");
  };

  recognition.onerror = (event) => {
    setSpeechStatus("Speech error: " + event.error);
  };

  recognition.onend = () => {
    setSpeechStatus("Listening stopped.");
  };

} else {
  setSpeechStatus(
    "Speech recognition is not supported by this browser."
  );
}

if (startListening) {
  startListening.addEventListener("click", () => {
    if (!recognition) {
      alert("Please use a browser that supports speech recognition.");
      return;
    }

    const languageCodes = {
      en: "en-US",
      my: "my-MM",
      th: "th-TH",
      ru: "ru-RU",
      zh: "zh-CN",
      hi: "hi-IN",
      ne: "ne-NP"
    };

    recognition.lang =
      languageCodes[sourceLang?.value] || "en-US";

    recognition.start();
  });
}

if (stopListening) {
  stopListening.addEventListener("click", () => {
    if (recognition) recognition.stop();
    setSpeechStatus("Listening stopped.");
  });
}

if (swapLanguages) {
  swapLanguages.addEventListener("click", () => {
    if (!sourceLang || !targetLang) return;

    const oldSource = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = oldSource;
  });
}

async function translateText() {
  const text = speechInput?.value.trim();

  if (!text) {
    alert("Please enter or speak some text first.");
    return;
  }

  const source = sourceLang?.value || "en";
  const target = targetLang?.value || "my";

  if (source === target) {
    if (translationOutput) {
      translationOutput.value = text;
    }
    return;
  }

  if (translationOutput) {
    translationOutput.value = "Translating...";
  }

  try {
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
      throw new Error("Translation failed.");
    }

    if (translationOutput) {
      translationOutput.value =
        data.responseData.translatedText;
    }

  } catch (error) {
    if (translationOutput) {
      translationOutput.value =
        "Translation error: " + error.message;
    }
  }
}

if (translateButton) {
  translateButton.addEventListener("click", translateText);
}

if (speakButton) {
  speakButton.addEventListener("click", () => {
    const text = translationOutput?.value.trim();

    if (!text) {
      alert("No translated text to speak.");
      return;
    }

    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported.");
      return;
    }

    const languageCodes = {
      en: "en-US",
      my: "my-MM",
      th: "th-TH",
      ru: "ru-RU",
      zh: "zh-CN",
      hi: "hi-IN",
      ne: "ne-NP"
    };

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang =
      languageCodes[targetLang?.value] || "en-US";

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  });
}

if (copyButton) {
  copyButton.addEventListener("click", async () => {
    const text = translationOutput?.value || "";

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      alert("Translation copied.");
    } catch {
      alert("Could not copy. Please select and copy the text manually.");
    }
  });
}


/* 4. THAILAND JOB FINDER */

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

  const language =
    languageText[languageValue] || "Thai English";

  const query = [
    keyword,
    province,
    language,
    "job vacancy",
    "hiring"
  ].join(" ");

  const url =
    "https://www.google.com/search?q=" +
    encodeURIComponent(query);

  window.open(url, "_blank", "noopener,noreferrer");
}

if (searchJobs) {
  searchJobs.addEventListener("click", () => {
    const keyword = jobKeyword?.value.trim() || "hotel jobs";

    searchThailandJobs(keyword);
  });
}

document.querySelectorAll("[data-keyword]").forEach((button) => {
  button.addEventListener("click", () => {
    const keyword = button.dataset.keyword;

    if (jobKeyword) jobKeyword.value = keyword;

    searchThailandJobs(keyword);
  });
});


/* 5. APP READY */

console.log("Alex AI Tools loaded successfully.");
