# Alex AI Tools + Alex's Gurd

A mobile-friendly web app for work and productivity. Existing tools are preserved, and **Alex's Gurd** is added as a separate personal work-assistant page.

## Existing tools (preserved)
- CV Maker — editable form and browser print / Save as PDF.
- Text and voice translation — multilingual translation through the existing Cloudflare Pages API route.
- Thailand Job Helper — prepares application text and opens job-search resources; it does not scrape job sites or guarantee live vacancies.

## New: Alex's Gurd
- Separate page: `/assistant.html`
- Work-focused assistant for job-search planning, CVs, applications, interview practice, workplace communication and task planning.
- Text chat and browser speech input / text-to-speech output where supported.
- Burmese, Thai and English reply-language setting.
- Chat history is stored in local browser storage on the device. Clearing browser site data removes it.
- The assistant endpoint is `/api/assistant` and calls Gemini from the Cloudflare Pages Function. The API key is server-side only.

## Required Cloudflare configuration
1. Open the Cloudflare Pages project connected to this repository.
2. Go to **Settings → Variables and Secrets** (the exact label may vary).
3. Add `GEMINI_API_KEY` as a secret for the Pages Functions runtime.
4. Add `ALEX_GURD_ACCESS_CODE` as a second secret. Choose a long, unique passphrase and keep it private.
5. Redeploy the latest branch/commit.
6. Open `/api/assistant` on the deployed site. It should report whether both secrets are configured.
7. Open `/assistant.html`, enter the access passphrase, and send a short test message.

The repository already has a translation function that also expects `GEMINI_API_KEY`. If that secret is already configured for the same Pages project, the assistant can use it too. Do not paste either secret into source code, GitHub files, chat, or the browser address bar. The passphrase is entered only in the dashboard form and sent over HTTPS to the Pages Function. This is a basic personal-use gate, not enterprise-grade authentication; do not publish the assistant as a public service.

## Cost and limitations
- This code does not guarantee that Gemini API usage is free. Check the current Google AI Studio model, quota and billing terms before using it regularly. Set usage limits where available.
- Browser speech recognition and speech synthesis depend on the Android browser, installed voices, microphone permission and language support. Text chat remains available if voice is unsupported.
- This is an assistant interface, not an autonomous agent. It does not apply for jobs, browse live listings, send messages, change accounts or execute actions by itself.
- Chat history is device-local; there is no encrypted cloud memory or account sync in this version.
- Do not enter passwords, one-time codes, full bank details or sensitive identity documents.
- Job information and employer details must be independently verified before applying or accepting work.

## Deploy
Deploy this repository using Cloudflare Pages **Connect to Git**. Use the repository's normal static-site setup with no framework build command and the project root as the output directory. Pages Functions in the `functions/` folder are deployed with the site.

## Existing TikTok Worker
Do not overwrite or modify the separate `alex-ai-studio` Worker, TikTok OAuth routes or its KV token storage as part of this project. TikTok LIVE integration is not included in Alex's Gurd.
