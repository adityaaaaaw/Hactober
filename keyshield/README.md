# 🛡️ KeyShield — AI-Powered Secret Leak Detection & Response

> **KeyShield** is a hackathon-ready, developer-first cybersecurity platform that detects leaked API keys, tokens, passwords, and private certificates in real-time, safely masks credentials, tracks incident status, and leverages local **Gemma 4** (`gemma4:e4b`) via **Ollama** to provide automated risk explanations and safe remediation fixes.

---

## ⚡ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Cybersecurity dark UI theme)
- **Database**: [SQLite](https://www.sqlite.org/) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) (Zero-config local persistence)
- **AI Engine**: **Gemma 4** (`gemma4:e4b`) served locally via **Ollama** (`http://localhost:11434/api/chat`)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🔒 Security Principles

1. **Zero Code Execution**: Uploaded source code and pasted snippets are strictly parsed as string data via deterministic regex automata. Code is never evaluated, compiled, or executed.
2. **Strict Masking**: Raw credentials are masked inline (e.g., `AKIA••••••••••••XXXX`). Full credentials are never rendered in the UI.
3. **Safe AI Prompts**: Prompts sent to Gemma 4 contain only masked signatures, line context, and metadata — raw secrets are never exposed to LLM prompts or server logs.
4. **Untrusted Input Sanitation**: File names are sanitized against path traversal (`../`) and capped to prevent memory attacks.
5. **No Automatic Revocation**: Findings guide developers through safe manual rotation procedures; keys are never programmatically revoked without human confirmation.
6. **Graceful Fallback**: If Ollama or the Gemma 4 model is not running, KeyShield falls back to its deterministic rule database without crashing.

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ (Node.js 22 tested)
- **npm** or **pnpm**
- (Optional, for AI explanations) **Ollama** with the Gemma 4 model:
  ```bash
  # Install Ollama from https://ollama.com
  ollama serve
  ollama pull gemma4:e4b
  ```

### 2. Installation

```bash
cd hactober/keyshield
npm install
```

### 3. Environment Configuration

Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Default variables:
```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e4b
DB_DIR=./data
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Features & Demonstration

- **Cybersecurity Dark Dashboard**: Live metric counters for Total Findings, Critical Risks, Resolved Findings, and Total Scans.
- **Upload & Paste Console**: Drop multiple source files (`.js`, `.ts`, `.py`, `.env`, `.tf`, `.json`, etc.) or paste code directly. Includes quick one-click demo presets (AWS leak, multi-secret cluster, clean code).
- **Deterministic Detection Engine**: Detects 16+ key categories:
  - AWS Access Key IDs & Secret Access Keys
  - GitHub PATs & OAuth Tokens
  - Stripe Secret & Publishable Keys
  - Slack API & Webhook URLs
  - Google API Keys & OAuth Secrets
  - Twilio Account SIDs & Auth Tokens
  - RSA & EC Private Key PEM blocks
  - Database connection strings (`postgres://`, `mongodb://`, `mysql://`)
  - OpenAI & Anthropic API keys
  - Supabase Service & Anon tokens
  - Generic hardcoded passwords & high-entropy JWT secrets
- **Gemma 4 AI Assistant**: Ask Gemma 4 via Ollama for in-depth threat vectors, blast radius analysis, and step-by-step developer remediation code.
- **Remediation Management**: Mark findings as `Resolved`, `Reopen`, or flag as `False Positive`.
- **Persistent Scan History**: Automatically logs every scan and risk tally into a local SQLite database (`data/keyshield.db`).

---

## ⏱️ 2-Minute Hackathon Demo Script

Follow this step-by-step walkthrough to present KeyShield during a 2-minute live judging demo:

```
+-------------------------------------------------------------------------------+
|  ⏱️ 2-MINUTE JUDGING WALKTHROUGH                                             |
+-------------------------------------------------------------------------------+
|  0:00 - 0:25  |  Problem & Dashboard Overview                                |
|  0:25 - 0:50  |  Scanning Untrusted Code & Instant Masking                   |
|  0:50 - 1:20  |  Local Gemma 4 AI Threat & Blast Radius Analysis             |
|  1:20 - 1:45  |  Remediation Checklist & Non-Destructive Safe Patch          |
|  1:45 - 2:00  |  Incident Resolution & SQLite Audit History                  |
+-------------------------------------------------------------------------------+
```

### [0:00 – 0:25] 1. The Hook & Platform Architecture
- **Narrative:** *"Hardcoded credentials in repositories cause 80% of preventable cloud breaches. KeyShield is an offline-ready, developer-first secret detection and remediation platform built with Next.js, SQLite, and local Gemma 4 via Ollama."*
- **Action:** Open `http://localhost:3000`. Point out the medium lavender background, clean white floating surfaces, live KPI cards (Total Findings, Critical Risks, Remediation Rate), and the active **Gemma 4 (`gemma4:e4b`)** connection badge in the floating header.

### [0:25 – 0:50] 2. Scanning Untrusted Code & Instant Masking
- **Narrative:** *"KeyShield treats all code as untrusted input. It never compiles or executes uploaded code, and never exposes raw secrets."*
- **Action:** In the **Scanner Console**, click the **Multi-Secret** quick sample button (or paste a snippet containing fake AWS and Stripe keys). Click **Analyze for Leaks**.
- **Result:** Within milliseconds, the static regex automata detects the leaks and renders them in the findings table with severity badges (`CRITICAL`, `HIGH`). Show the **Masked Signature** column (e.g., `sk_l••••••••••••7766`), highlighting that raw keys are strictly concealed.

### [0:50 – 1:20] 3. Local Gemma 4 AI Analysis (No Cloud Leakage)
- **Narrative:** *"Traditional scanners leave developers with raw alerts. KeyShield automatically consults a local Gemma 4 LLM to calculate blast radius and attack pathways without leaking code to cloud APIs."*
- **Action:** Click the top finding in the table to open the **Inspection Drawer**.
- **Result:** Show the AI-generated report directly from `gemma4:e4b` structured into:
  1. **Risk & Impact:** Financial fraud risk and administrative exposure.
  2. **Remediation Steps:** Immediate rotation procedures.
  3. **Prevention:** Proper environment variable architecture.

### [1:20 – 1:45] 4. Remediation Checklist & Non-Destructive Safe Patch
- **Narrative:** *"KeyShield enforces human-in-the-loop security. We provide an interactive 4-phase checklist and generate safe, non-destructive code patches without touching developer files."*
- **Action:**
  - In the **Remediation Checklist**, tick the first two checkboxes (*1. Invalidate Compromised Key* and *2. Store New Secret in .env*). Note the dynamic progress indicator (*"2 of 4 completed"*).
  - Show the **Safe Patch Proposal** with git-style red/green diff and the ready-to-use `.env` snippet. Click **Copy Git Diff** to show developer convenience.

### [1:45 – 2:00] 5. Resolution & Audit History
- **Narrative:** *"Once remediated, developers verify and log the incident for compliance."*
- **Action:** Click **Mark as Resolved**.
- **Result:** Watch the status badge switch to emerald `Resolved`, the **Resolved Findings** KPI card increment, and scroll down to the **Audit & Scan History** panel showing the timestamped scan event stored in local SQLite.

---

## 🛠️ Verification & Build Commands

```bash
# Run ESLint & TypeScript Checks
npm run lint

# Production Build
npm run build

# Start Production Server
npm run start
```
