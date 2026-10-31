# HAR Reader

> **An advanced, offline-first HTTP Archive (HAR) analyzer and multi-session traffic inspector designed for high-performance network debugging.**  
> Analyzing complex HTTP archive files across multiple sessions and microservices often leads to browser memory bloat, unreadable payloads, and fragmented workflows; **HAR Reader** solves this by providing a unified, client-side engine that ingests, normalizes, and cross-correlates multi-archive network logs with native format previews, Arabic/Unicode deep search, JSON table unrolling, and native Excel XLSX export.

---

## Core Features

- **Multi-Archive Ingestion & Merging**: Load multiple `.har`, `.json`, or raw HTTP logs concurrently. Toggle between individual archives or analyze a unified cross-archive timeline.
- **Deep Unicode & Arabic Normalized Search**: Advanced multi-token search engine with Arabic diacritic (Tashkeel) stripping, Alef/Taa/Yaa unification, HTML/URL entity decoding, and full-corpus indexing across URLs, headers, queries, and response bodies.
- **Native Format-First Inspector**:
  - **HTML Webpage Replay**: Sandboxed preview with automated virtual asset injection that resolves CSS, JS, and image assets directly from loaded HAR archives.
  - **Multimedia Previews**: In-app rendering for base64 images, interactive PDF documents, and audio/video playback.
  - **Interactive JSON Viewer**: Syntax-highlighted JSON viewer with one-click value copying and integrated in-code search.
- **Interactive JSON Table Unroller**: Convert nested JSON arrays and API responses into flat interactive tables with nested object drawers.
- **Smart Duplicate Merging**: Automatically detect unique identifier columns (e.g., `id`, `uuid`, `student_id`, `email`) and collapse redundant pagination calls into single composite rows.
- **Column Exclusion & Dynamic Resizing**: Custom column toggle menu and drag-to-resize column headers for granular data analysis.
- **Zero-Dependency XLSX & CSV Export**: Export analyzed tables directly into native Microsoft Excel (`.xlsx` SpreadsheetML) or UTF-8 CSV without relying on external CDNs or heavy npm packages.
- **Hierarchical Tree Diagram**: Visual domain-and-route diagram providing instant architectural visibility of endpoint topologies.
- **Request Suppression & Multi-Selection**: Batch select calls for suppression, table unrolling, or inspection with persistent session tracking.
- **Strict Client-Side Privacy**: Runs 100% locally in modern browsers or Android WebView wrappers. Zero telemetry, zero external network requests, zero data collection.

---

## Tech Stack & Architecture

- **Runtime & Engine**: Vanilla ECMAScript 2022+ (Zero external runtime dependencies).
- **Interface & Design**: Semantic HTML5 and modern CSS3 utilizing CSS Custom Properties, flexbox/grid layout, and adaptive Dark/Light theme switching.
- **Data Export Pipeline**: Native SpreadsheetML XML generation for compliant, high-performance Microsoft Excel files.
- **Sandboxing & Security**: Isolated iframe rendering with strict script boundary sandboxing to prevent cross-origin contamination from captured responses.
- **Deployment Platform**: Optimized for Vercel static edge hosting with HTTP security headers and aggressive asset caching.

```
HARadvanced/
├── assets/
│   └── icon.svg              # Vector application icon
├── css/
│   └── style.css             # Production stylesheet & dark/light palettes
├── js/
│   └── app.js                # Core parsing, table unrolling & export engine
├── .env.example              # Environment variables template
├── .gitignore                # Production ignore rules
├── index.html                # Semantic HTML5 entry point
├── LICENSE                   # MIT License
├── package.json              # Project manifest and dev server scripts
├── README.md                 # Executive documentation
├── tool.json                 # Native application descriptor
└── vercel.json               # Vercel deployment & security headers configuration
```

---

## Prerequisites & Setup

### Prerequisites
- Any modern web browser supporting ES6+ (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
- *(Optional)* [Node.js](https://nodejs.org/) (v16.0.0 or higher) for local server preview.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/FAYSAL-Q8/HARadvanced.git
   cd HARadvanced
   ```

2. **Run locally**:
   Since HAR Reader is built with zero runtime dependencies, you can open `index.html` directly in your browser or serve it with any static server:

   ```bash
   # Using npx serve (Node.js)
   npx serve .

   # Or using Python 3
   python -m http.server 3000
   ```

3. Open your browser and navigate to `http://localhost:3000`.

---

## Usage & Execution Guide

### 1. Ingesting HAR Archives
- Drag and drop one or more `.har` files into the universal dropzone or click to select files.
- When loading multiple files, the **Imported Archives** bar allows switching between individual files or viewing all requests combined.

### 2. Deep Search & Filtering
- Use `Ctrl + K` or `/` to focus the deep search input.
- Type search terms (including Arabic text or Unicode characters); the engine normalizes variants and searches URLs, headers, payloads, and response bodies simultaneously.
- Filter by HTTP Method (`GET`, `POST`, `PUT`, `DELETE`), HTTP Status (`2xx`, `3xx`, `4xx`, `5xx`, `ERR`), or Asset Category (`JSON`, `HTML`, `JS`, `CSS`, `Images`, `PDF`, `Sheets`).

### 3. Native Previews & Inspection
- Click on any request row to open the **Detail Inspector Modal**.
- Navigate between tabs:
  - **Format Preview**: Automatically renders webpages, images, PDFs, media, or copy-ready JSON.
  - **Source Code**: Full raw text viewer with case-insensitive search and line matching.
  - **Headers & Query**: Structured tables displaying all request/response metadata.
  - **cURL**: Generate clean, ready-to-paste cURL CLI commands.
  - **Table / Records**: Unroll JSON responses into spreadsheet tables.

### 4. JSON Table Unrolling & Excel Export
- From the detail modal or the **Path Tables** combiner modal, select endpoints to unroll.
- Toggle **Merge Duplicates** to collapse repeated items sharing a common key.
- Toggle columns on/off using the **Columns** dropdown.
- Click **Export XLSX** to generate a native `.xlsx` spreadsheet on the fly.

### 5. Deploying to Vercel

Deploy instantly to Vercel with zero configuration:

```bash
npm install -g vercel
vercel
```

Or connect the GitHub repository directly in the [Vercel Dashboard](https://vercel.com/new). The included `vercel.json` automatically configures clean URLs and security headers.

---

## Author

**Faysal Alibrahim**  
GitHub: [https://github.com/FAYSAL-Q8](https://github.com/FAYSAL-Q8)

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
