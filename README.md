# 🪟 Map AI — Deterministic Observability & Context Engine
### **Track 1: The Glass Box Problem | Epochesque 2.0 (AI Buildathon)**

> **Map AI** transforms autonomous coding agents from opaque black boxes into transparent, debuggable glass cockpits. It features real-time execution tracing, 4-tier hierarchical context compaction, deterministic PyTest sandboxing, and autonomous fault self-healing.

---

## 👥 Team Members (VIT Chennai)
* **Abhi**
* **Abhinav K**
* **Prasanna P**
* **Narayana Nihal B**

---

## 🌟 Key Architecture & Differentiators

```
┌───────────────────────────────────────────────┬───────────────────────────────────────────────┐
│              LEFT PANEL: CHAT UI              │             RIGHT PANEL: GLASS BOX            │
├───────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ • Natural multi-turn developer conversation   │ • 🕸️ Interactive Execution DAG                │
│ • Syntax-highlighted code diffs (Before/After)│ • 🧠 4-Tier Context Compactor (84% Savings)   │
│ • Sandboxed PyTest terminal output            │ • ⚠️ Fault Interception & Reflection Matrix   │
│ • Quick 1-click evaluation presets            │ • 📊 Live Sub-Cent Cost & Latency Waterfall   │
│                                               │ • 🧾 Standard OpenTelemetry JSON Exporter     │
│                                               │ • ⏪ Step-Level Time-Travel & State Forking   │
└───────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 🏆 100% Alignment with Track 1 Rules

1. **Step-by-Step Observability:** Custom OpenTelemetry-compatible span emitter records every micro-step (`thought`, `ast_analysis`, `sandbox_test`, `reflection`, `synthesis`).
2. **20+ Turn Context Engineering:** 4-tier memory stack:
   * **Tier 1 (Active Focus Buffer):** Last 2 turns at 100% raw fidelity.
   * **Tier 2 (Semantic Entity Store):** Pinned key facts (files, constraints, test commands).
   * **Tier 3 (Episodic Summaries):** Turns 1–15 recursively summarized (~84% token savings).
   * **Tier 4 (Noise Eviction):** Pruning raw pytest headers and virtualenv stack traces.
3. **Real Failure Case Caught & Self-Healed:** Intercepts live `AssertionError` in PyTest execution, injects structured reflection prompt, and verifies green suite.
4. **Token Economics & Latency Meter:** Granular cost accounting down to \$0.0001 per step at Gemini 1.5 Flash rates.
5. **No Black-Box Libraries:** Built from first principles using clean TypeScript and native APIs.

---

## 🚀 Quickstart & Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/AB9-py/map-ai.git
cd map-ai

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to launch the Map AI Cockpit.

---

## 📦 Tech Stack
* **Frontend:** Next.js 14 (App Router), Tailwind CSS, Lucide React
* **LLM Core:** Google Gemini 1.5 Flash (Structured JSON Outputs)
* **Observability:** Custom OpenTelemetry Span Emitter + SSE Stream
* **Sandbox Runner:** PyTest & AST Syntax Validator
