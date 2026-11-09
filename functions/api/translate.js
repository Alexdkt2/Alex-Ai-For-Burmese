const LANGUAGE_NAMES = {
  "en": "English",
  "my": "Myanmar (Burmese)",
  "th": "Thai",
  "hi": "Hindi",
  "ne": "Nepali",
  "zh-CN": "Simplified Chinese",
  "ja": "Japanese",
  "ko": "Korean",
  "ar": "Arabic",
  "fr": "French",
  "de": "German",
  "es": "Spanish",
  "pt": "Portuguese",
  "ru": "Russian",
  "vi": "Vietnamese",
  "id": "Indonesian",
  "ms": "Malay"
};

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        { error: "AI translation is not connected yet. Add GEMINI_API_KEY in Cloudflare Pages Settings > Environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const source = LANGUAGE_NAMES[body.source];
    const target = LANGUAGE_NAMES[body.target];

    if (!text) return Response.json({ error: "Please enter text." }, { status: 400 });
    if (text.length > 8000) {
      return Response.json({ error: "Text is too long. Maximum is 8,000 characters." }, { status: 413 });
    }
    if (!source || !target) {
      return Response.json({ error: "Please choose supported source and target languages." }, { status: 400 });
    }
    if (body.source === body.target) {
      return Response.json({ translation: text });
    }

    const prompt = [
      "You are a professional multilingual translator.",
      "Translate the text below from " + source + " into " + target + ".",
      "Preserve the exact meaning, names, numbers, formatting, and intent.",
      "Use natural, fluent everyday language. For Thai, use natural Thai phrasing.",
      "For Myanmar, use clear, natural Myanmar Burmese.",
      "Do not summarize, explain, add notes, or include the original text.",
      "Return only the translated text.",
      "",
      "TEXT TO TRANSLATE:",
      text
    ].join("\n");

    const apiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096
          }
        })
      }
    );

    const result = await apiResponse.json();
    if (!apiResponse.ok) {
      return Response.json(
        { error: result.error?.message || "AI provider request failed. Please try again later." },
        { status: apiResponse.status === 429 ? 429 : 502 }
      );
    }

    const translation = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!translation) {
      return Response.json({ error: "AI could not translate this text. Please try again." }, { status: 502 });
    }

    return Response.json({ translation });
  } catch (error) {
    return Response.json({ error: "Translation request failed. Please check your connection and try again." }, { status: 500 });
  }
}
