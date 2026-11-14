# Alex's Gurd — Personal Work Assistant

A mobile-friendly web app with a work-focused assistant and the original tools preserved:
1. CV Maker — editable form, live preview, browser print / Save as PDF.
2. Voice Translator — browser speech recognition (where supported), text translation via MyMemory public API, and browser text-to-speech.
3. Thailand Job Finder — targeted searches across JobThai, JobsDB, Indeed Thailand, JobTopGun and Google. This starter opens search results; it does not scrape or aggregate job listings.

## Project safety
- Deploy this project as a **separate Cloudflare Pages project**.
- Do not replace or edit the existing `alex-ai-studio` Worker or its TikTok OAuth routes / KV token storage.
- The existing Worker URL can remain online. This starter can later be connected through a separate subdomain or Pages URL.

## Deploy from Android using GitHub
1. Extract `alex-ai-tools.zip`.
2. In GitHub, create a new repository named `alex-ai-tools`.
3. Upload `index.html`, `styles.css`, `app.js`, and this `README.md` to the repository root.
4. In Cloudflare Dashboard, open **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
5. Select the `alex-ai-tools` repository.
6. Framework preset: **None**. Build command: leave blank. Build output directory: `/` (or `.` if the UI requires it).
7. Deploy. Cloudflare will provide a Pages URL.

## Notes and next production steps
- Voice recognition availability depends on the browser/device and microphone permission. Use HTTPS and allow microphone access.
- Translation is sent to MyMemory's public translation endpoint. Do not enter confidential personal, legal, medical, or financial information.
- Job searches link to original platforms. Before calling this an all-site live job aggregator, build source integrations, deduplication, freshness checks, and a lawful data-access approach.
- CV data stays in the browser in this starter and is not uploaded to a server.
- Add a privacy notice and terms page before public promotion or collecting user data.

## Alex's Gurd work assistant
- The dashboard adds a work-focused chat assistant for job applications, CVs, interview practice and workplace communication.
- The API endpoint is `/api/assistant` in `functions/api/assistant.js`.
- Configure `GEMINI_API_KEY` as a Cloudflare Pages environment variable/secret for Production (and Preview if used). Never put the key in browser JavaScript or commit it to GitHub.
- Without the secret, the assistant returns a clear setup message; it does not pretend to be connected.
- Browser speech recognition and text-to-speech depend on Android browser support, microphone permission and installed language voices. Text chat remains available.
- Review generated job applications before sending. Do not share passwords, OTPs or full financial credentials.
