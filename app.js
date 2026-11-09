
const $ = id => document.getElementById(id);

const languages = {
  "English": "en",
  "Myanmar": "my",
  "Thai": "th",
  "Hindi": "hi",
  "Nepali": "ne",
  "Chinese": "zh-CN",
  "Japanese": "ja",
  "Korean": "ko",
  "Arabic": "ar",
  "French": "fr",
  "German": "de",
  "Spanish": "es",
  "Portuguese": "pt",
  "Russian": "ru",
  "Vietnamese": "vi",
  "Indonesian": "id",
  "Malay": "ms",
  "Burmese": "my"
};

function fillLanguages(id) {
  const select = $(id);
  if (!select) return;

  select.innerHTML = "";

  Object.entries(languages).forEach(([name, code]) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    select.appendChild(option);
  });
}

["sourceLang", "targetLang", "voiceSource", "voiceTarget"]
.forEach(fillLanguages);

$("sourceLang").value = "my";
$("targetLang").value = "en";
$("voiceSource").value = "my";
$("voiceTarget").value = "th";

function showTool(name) {
  document.querySelectorAll(".panel").forEach(panel => {
    panel.hidden = true;
  });

  const panel = $("panel-" + name);

  if (panel) {
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth" });
  }
}

async function translate(text, source, target) {
  if (!text.trim()) throw new Error("Please enter text.");

  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", source + "|" + target);

  const response = await fetch(url);
  if (!response.ok) throw new Error("Translation service unavailable.");

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || "Translation failed.");
  }

  return data.responseData.translatedText;
}

async function translateText() {
  const output = $("outputText");
  output.value = "Translating...";

  try {
    output.value = await translate(
      $("inputText").value,
      $("sourceLang").value,
      $("targetLang").value
    );
  } catch (error) {
    output.value = error.message;
  }
}

function copyResult() {
  copyText($("outputText").value);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied!");
  } catch {
    alert("Copy unavailable. Please select and copy manually.");
  }
}

let recognition;

function startVoice() {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice recognition is not supported. Try Chrome.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = $("voiceSource").value;
  recognition.continuous = false;
  recognition.interimResults = false;

  $("voiceStatus").textContent = "Listening...";

  recognition.onresult = event => {
    $("voiceInput").value =
      event.results[0][0].transcript;
    $("voiceStatus").textContent = "Speech recognized.";
  };

  recognition.onerror = () => {
    $("voiceStatus").textContent = "Voice recognition failed.";
  };

  recognition.onend = () => {
    if ($("voiceStatus").textContent === "Listening...") {
      $("voiceStatus").textContent = "Finished.";
    }
  };

  recognition.start();
}

async function translateVoice() {
  $("voiceOutput").value = "Translating...";

  try {
    $("voiceOutput").value = await translate(
      $("voiceInput").value,
      $("voiceSource").value,
      $("voiceTarget").value
    );
  } catch (error) {
    $("voiceOutput").value = error.message;
  }
}

function speakTranslation() {
  const text = $("voiceOutput").value;

  if (!text) return alert("No translation available.");

  if (!("speechSynthesis" in window)) {
    return alert("Speech is not supported.");
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = $("voiceTarget").value;

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function generateCV() {
  const fields = [
    ["Full Name", "cvName"],
    ["Phone", "cvPhone"],
    ["Email", "cvEmail"],
    ["Address", "cvAddress"],
    ["Applying Position", "cvJob"],
    ["Skills", "cvSkills"],
    ["Work Experience", "cvExperience"],
    ["Education", "cvEducation"]
  ];

  let html = "<h1>CURRICULUM VITAE</h1>";

  fields.forEach(([label, id]) => {
    const value = $(id).value.trim();
    if (value) {
      const safe = value.replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);

      html += `<h3>${label}</h3><p>${safe.replace(/\n/g, "<br>")}</p>`;
    }
  });

  $("cvResult").innerHTML = html;
}

function printCV() {
  if (!$("cvResult").innerHTML) {
    return alert("Generate your CV first.");
  }

  const content = $("cvResult").innerHTML;
  const win = window.open("", "_blank");

  if (!win) return alert("Allow pop-ups to print your CV.");

  win.document.write(`
    <html>
    <head>
      <title>My CV</title>
      <style>
        body { font-family: Arial; padding: 35px; }
        h1 { text-align: center; }
        h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `);

  win.document.close();
  win.onload = () => win.print();
}

function generateJobText() {
  const position = $("jobPosition").value;
  const location = $("jobLocation").value;
  const experience = $("jobExperience").value;

  $("jobResult").value =
`Dear Hiring Manager,

I am interested in applying for the ${position} position in ${location}.

My experience:
${experience}

I am hardworking, responsible and willing to learn.

Thank you for considering my application.

Best regards`;
}

function copyJob() {
  copyText($("jobResult").value);
}
