const LANGUAGES = { en: "English", my: "Burmese", th: "Thai", auto: "the language used by the user" };

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GEMINI_API_KEY) {
      return Response.json({ error: "AI is not connected yet. Add GEMINI_API_KEY as a secret in Cloudflare Pages Settings > Environment variables." }, { status: 503 });
    }
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const language = LANGUAGES[body.language] || LANGUAGES.auto;
    if (!message) return Response.json({ error: "Please enter a work task." }, { status: 400 });
    if (message.length > 5000) return Response.json({ error: "Please keep each message under 5,000 characters." }, { status: 413 });

    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const safeHistory = history.map(item => ({
      role: item && item.role === "assistant" ? "model" : "user",
      parts: [{ text: String(item && item.text || "").slice(0, 3000) }]
    })).filter(item => item.parts[0].text);

    const system = [
      "You are Alex's Gurd, a practical personal work assistant.",
      "Help with job searching strategies, CV writing, applications, interview practice, workplace communication, translation planning and organizing work tasks.",
      "Be honest, concise, supportive and step-by-step for a beginner using an Android phone.",
      "Prefer low-cost or free methods. Never claim to have applied for jobs, contacted employers, sent messages or performed actions unless a connected tool actually did so.",
      "Do not ask for passwords, OTPs, full bank details or unnecessary identity documents.",
      "Do not invent job vacancies, salaries, employer contact details or legal requirements. Tell the user when current information needs checking.",
      "Reply in " + language + ". If language is auto, follow the user's message language.",
      "The user may be in Thailand and may ask about work; do not assume eligibility or guarantee employment."
    ].join(" ");

    const contents = [...safeHistory, { role: "user", parts: [{ text: message }] }];
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 0.5, maxOutputTokens: 1200 }
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return Response.json({ error: data.error?.message || "AI provider request failed. Check the API key and quota." }, { status: upstream.status === 429 ? 429 : 502 });
    }
    const reply = data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!reply) return Response.json({ error: "The AI did not return a reply. Please try again." }, { status: 502 });
    return Response.json({ reply });
  } catch {
    return Response.json({ error: "Assistant request failed. Check your connection and try again." }, { status: 500 });
  }
}
