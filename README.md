# SynthForge

**SynthForge** is a high-fidelity synthetic data generation and data engineering platform built with React 19, TypeScript, Vite, Tailwind CSS, Web Workers, and an Express backend. It empowers data engineers, machine learning practitioners, software developers, and QA engineers to construct realistic tabular datasets, complex relational multi-table schemas with zero orphan foreign keys, and strictly reconciled enterprise documents (invoices and multi-month bank statements).

> **Offline-First & Zero-Cost**: SynthForge runs 100% locally in your browser. All authentication, data persistence (IndexedDB), and deterministic synthetic engines operate without third-party external services or mandatory cloud accounts. An AI API key is completely optional.

---

## Key Features

1. **Tabular Generator & Profiler**:
   - 45+ domain data types (names, emails, credit cards, UUIDs, categorical weighted distributions, IP addresses, financial transactions, timestamps).
   - Seeded deterministic generation using pseudo-random number generator (PRNG) algorithms.
   - Built-in edge-case injection (nulls, extreme values, duplicates, unicode/emoji strings, format corruption).
   - Differential privacy features including Laplace noise injection, k-anonymity masking, and PII anonymization.
   - Web Worker generation supporting datasets up to 1,000,000 rows with background chunked streaming.

2. **Relational Schema Architect**:
   - Multi-table relational modeling (1:1, 1:N, N:N junction tables) with strict referential integrity.
   - Guarantee of **zero orphan foreign keys**: child rows strictly sample existing parent primary keys.
   - Computed post-processing columns (e.g. order totals derived from line item sums).
   - Interactive ER diagram visualization powered by `@xyflow/react`.

3. **Complex Enterprise Documents**:
   - Multi-regional support (**US**, **UK**, **PK**, **EU**) with localized currencies, date conventions, tax schemas (Sales Tax, VAT, Sales Tax on Services, MwSt), and banking codes (ABA routing, UK Sort Code, 1Link/Raast, IBAN/BIC).
   - **Reconciled Invoices**: Line items, quantity, unit price, discounts, tax amounts, and totals with exact cent-level arithmetic ($Total = Subtotal - Discount + Tax$).
   - **Bank Statements**: Multi-month running transaction ledgers where $Closing = Opening + Credits - Debits$, maintaining continuous running balance reconciliation after every line item.
   - Single vector PDF downloads via dynamic jsPDF and bulk ZIP generation containing PDFs, JSON, and CSV ledgers.

4. **Interactive Exploratory Data Analysis (EDA) & Quality Suite**:
   - Web worker powered statistical profiling: mean, median, IQR, std dev, skewness, missing value ratios, cardinality.
   - Correlation heatmaps, distribution histograms, and automated synthetic data fidelity scoring.

5. **In-Browser Python Notebooks (Pyodide)**:
   - Full client-side Python 3 runtime powered by WebAssembly (Pyodide).
   - Pre-installed with Pandas, NumPy, and Matplotlib.
   - Loads dynamically only when the Notebooks tab is opened, with CDN failure recovery and retry capabilities.

6. **Client-Side Authentication & Isolated Multi-Tenant Storage**:
   - 100% free, private local accounts stored in browser IndexedDB.
   - Web Crypto API PBKDF2 password hashing (SHA-256, 150,000 iterations, 16-byte cryptographically secure salt).
   - Lockout protection (account lockout for 60 seconds after 5 failed attempts).
   - Ephemeral Guest Mode and pre-seeded Demo Account (`demo@synthforge.app` / `Demo12345`).
   - Scoped data isolation: Saved datasets, jobs, and recent projects are isolated per user ID.

7. **Flexible AI Schema Architect & Static Hosting Fallback**:
   - Natural language prompt-to-schema synthesis via server-side Gemini 2.5 Flash (`process.env.GEMINI_MODEL`).
   - Fully resilient: If the backend or AI endpoint is unreachable, SynthForge automatically switches to browser-side keyword pattern matching with an honest status badge (`AI: Gemini` vs `AI: Offline rules`).

---

## Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Visualization**: Recharts, Lucide Icons, @xyflow/react
- **Data & Documents**: jsPDF, JSZip, XLSX (dynamically imported on-demand)
- **Runtime & WebAssembly**: Pyodide (client-side Python)
- **Local Storage**: IndexedDB (versioned stores for users and datasets), localStorage for session tokens
- **Backend / Dev Server**: Node.js, Express, tsx

---

## Setup & Running Locally

### Prerequisites
- Node.js 20+ (Node.js 22 recommended)
- npm (or bun / pnpm)

### Installation
```bash
git clone https://github.com/Hassan6462/synthforge.git
cd synthforge
npm install
```

### Environment Configuration
Copy the `.env.example` file:
```bash
cp .env.example .env
```

Contents of `.env`:
```env
# Optional: Google AI Studio Gemini API Key for AI Schema Assistant
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash

# Server Configuration
PORT=3000
NODE_ENV=development
DISABLE_HMR=false
```

> **Note**: SynthForge runs **fully and completely without an API key**. If `GEMINI_API_KEY` is not provided or the backend is offline, the application seamlessly activates built-in deterministic heuristic rule templates.

### Running in Development
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Running Tests
```bash
npm test
```
Executes the Vitest suite verifying:
- Deterministic identical output across matching PRNG seeds.
- Zero orphan foreign keys across relational presets.
- Invoice total arithmetic ($Total = Subtotal - Discount + Tax$).
- Bank statement running balance ledger continuity.

### Production Build & Full-Stack Server
```bash
# Build the client bundle (optimally chunked with code-splitting)
npm run build

# Start the Express production server
npm start
```

---

## Project Structure

```text
├── .env.example             # Documented environment variables
├── index.html               # Entry HTML template with SEO tags
├── metadata.json            # Application metadata & capabilities
├── package.json             # Scripts & dependencies
├── server.ts                # Express backend proxy with Gemini integration & fallback
├── src/
│   ├── main.tsx             # React DOM entry point
│   ├── App.tsx              # Core app component, auth gating, and global state
│   ├── index.css            # Tailwind theme tokens and layout styling
│   ├── components/
│   │   ├── Header.tsx       # Top navigation, actions, quality score & user menu
│   │   ├── Sidebar.tsx      # Schema & preset selection drawer
│   │   ├── CenterPreview.tsx # Tabular virtualized table, ER diagram, document viewer
│   │   ├── ConfigPanel.tsx  # Generation settings, columns editor, export buttons
│   │   ├── LoginPage.tsx    # Auth screens (sign in, create account, forgot password, guest, demo)
│   │   ├── UserMenu.tsx     # Account dropdown with profile trigger and sign out
│   │   ├── ProfileModal.tsx # Account management and password update
│   │   ├── DescribeItModal.tsx # Natural language schema builder (with AI source badge)
│   │   ├── CopilotSidePanel.tsx # AI schema recommendations & patches
│   │   ├── NotebooksPage.tsx # Pyodide Python notebook environment
│   │   ├── EDAPage.tsx      # Exploratory data analysis charts & summary statistics
│   │   ├── QualityPage.tsx  # Synthetic data fidelity evaluator
│   │   ├── TimeSeriesPage.tsx # Temporal trend and seasonality synthesizer
│   │   ├── ScenarioBuilderPage.tsx # Stress testing & edge-case scenario injector
│   │   ├── DataSourcesPage.tsx # IndexedDB dataset manager and CSV/Excel file parser
│   │   ├── JobsPage.tsx     # Generation execution history & parameter diffing
│   │   └── ApiPage.tsx      # Mock REST/cURL endpoint documentation
│   ├── context/
│   │   ├── AuthContext.tsx  # PBKDF2 auth provider & session manager
│   │   └── ToastContext.tsx # User notification toasts
│   ├── data/
│   │   ├── presets.ts       # Tabular, relational, and document default presets
│   │   ├── defaultNotebooks.ts # Ready-to-run Pyodide Python notebooks
│   │   └── scenarioPresets.ts # Stress-testing scenario templates
│   ├── hooks/
│   │   └── useSyntheticWorker.ts # Bridge hook to generator Web Worker
│   ├── types/
│   │   ├── index.ts         # Tabular, relational, and job interfaces
│   │   ├── auth.ts          # User, credentials, and session types
│   │   └── documents.ts     # Invoices and bank statement domain models
│   ├── utils/
│   │   ├── auth.ts          # Web Crypto PBKDF2 hashing, lockout tracker, validation
│   │   ├── indexedDb.ts     # Versioned IndexedDB stores for users & datasets
│   │   ├── prng.ts          # Seeded deterministic pseudo-random number generator
│   │   ├── generators.ts    # Tabular, relational, and document synthesizers
│   │   ├── generators.test.ts # Vitest verification suite
│   │   ├── documentGenerators.ts # Reconciled invoice and bank statement math
│   │   ├── export.ts        # CSV, JSON, NDJSON, SQL, and ZIP export routines
│   │   ├── pdfExport.ts     # jsPDF vector document layouts
│   │   ├── csvParser.ts     # Dynamic Excel & CSV parser with 10MB guard
│   │   ├── keywordTemplates.ts # Offline schema fallback generator
│   │   └── copilotFallback.ts # Offline copilot recommendation rules
│   └── workers/
│       ├── generator.worker.ts # Background thread for high-volume dataset synthesis
│       └── eda.worker.ts    # Background thread for statistical analysis
├── tsconfig.json            # Strict TypeScript configuration
└── vite.config.ts           # Vite build pipeline with optimized manual chunks
```

---

## License

SynthForge is open-source under the MIT License.
