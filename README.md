# Map AI 2.1

Map AI is a local AI codebase debugger. Load a public GitHub repository or a ZIP file, explore its files, and ask Gemini for code explanations and suggested fixes.

## Features

- Public GitHub repository loading, including repositories whose default branch is not `main`.
- ZIP-codebase upload.
- Local SQLite storage for debugging sessions and source files.
- Gemini-powered code analysis and suggested diffs.
- Persistent run, trace-step, and failure-event observability in SQLite.
- Server-side Gemini token usage and estimated cost accounting; local steps are always $0.
- Files, Trace, Failure Catcher, and Forks right-panel tabs.
- Immutable restart and fork-from-step run lineage.
- Uploaded source is treated as data for analysis and is never executed on the host.
- Explicit suggested patches can be applied only to the immutable uploaded session snapshot after user action; the host filesystem is never modified.

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

Do not include placeholder values or surrounding quotes. Stop any existing Next.js process and restart after changing `.env.local`; `/api/config` reports only model, configured/demo booleans, and setup guidance—never the key.

For a provider-free demo:

```bash
GEMINI_DEMO_MODE=true npm run dev
```

The demo mode supports ZIP upload, the six-step trace, safe C compilation-unavailable reporting, persisted runs, Failure Catcher, restart/fork lineage, and zero API cost.

Then start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes

- GitHub loading supports public repositories only; private repositories require a future token-based integration.
- Sessions are stored locally in `debug.db`. It, its SQLite journal files, and `.env.local` are intentionally ignored by Git.
- The application uses the Gemini Flash model configured in `lib/gemini.ts`.
- Run observability records are stored alongside sessions in `runs`, `trace_steps`, and `failure_events`.
- Run focused checks with `npm test`; external Gemini availability is required for live analysis but not for the persistence and API tests.
- `POST /api/patch` applies an explicit `oldCode` → `newCode` replacement inside the uploaded session snapshot only, rejecting stale or ambiguous patches.
