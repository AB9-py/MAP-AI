# Map AI 2.0

Map AI is a local AI codebase debugger. Load a public GitHub repository or a ZIP file, explore its files, and ask Gemini for code explanations and suggested fixes.

## Features

- Public GitHub repository loading, including repositories whose default branch is not `main`.
- ZIP-codebase upload.
- Local SQLite storage for debugging sessions and source files.
- Gemini-powered code analysis and suggested diffs.
- Minimal chat, file explorer, and debug-trace interface.

## Run on another computer

Prerequisites: Node.js 20 or newer and a Gemini API key.

```bash
git clone https://github.com/AB9-py/MAP-AI.git
cd MAP-AI
npm ci
cp .env.example .env.local
```

Set your key in `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Then start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes

- GitHub loading supports public repositories only; private repositories require a future token-based integration.
- Sessions are stored locally in `debug.db`. It, its SQLite journal files, and `.env.local` are intentionally ignored by Git.
- The application uses the Gemini Flash model configured in `lib/gemini.ts`.
