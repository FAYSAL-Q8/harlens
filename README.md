# HarLens

> **An advanced, offline-first HTTP Archive (HAR) analyzer and multi-session traffic inspector designed for high-performance network debugging.**  
> Analyzing complex HTTP archive files across multiple sessions and microservices often leads to browser memory bloat, unreadable payloads, and fragmented workflows; **HarLens** solves this by providing a unified, client-side engine that ingests, normalizes, and cross-correlates multi-archive network logs with native format previews, Arabic/Unicode deep search, JSON table unrolling, and native Excel XLSX export.

[![Live Web Tool](https://img.shields.io/badge/Live%20App-harlens.vercel.app-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](https://harlens.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-00e599?style=for-the-badge)](LICENSE)

---

## 🚀 Live Access

**No download, installation, or configuration required.**  
Access the web tool directly from any browser or mobile device:

### 👉 **[https://harlens.vercel.app/](https://harlens.vercel.app/)**

Simply drag & drop your `.har` file(s) into the browser window to start analyzing immediately. All processing runs 100% locally on your machine—no data is uploaded to any server.

---

## Core Features

- **Multi-Archive Ingestion & Merging**: Load multiple `.har`, `.json`, or raw HTTP logs concurrently. Toggle between individual archives or analyze a unified cross-archive timeline.
- **Deep Unicode & Arabic Normalized Search**: Advanced multi-token search engine with Arabic diacritic (Tashkeel) stripping, Alef/Taa/Yaa unification, HTML/URL entity decoding, and full-corpus indexing across URLs, headers, queries, and response bodies.
- **Native Format-First Inspector**:
  - **HTML Webpage Replay**: Sandboxed preview with automated virtual asset injection that resolves CSS, JS, and image assets directly from loaded HAR archives.
  - **Multimedia Previews**: In-app rendering for base64 images, interactive PDF documents, and audio/video playback.
  - **Interactive JSON Viewer**: Syntax-highlighted JSON viewer with one-click value copying and integrated in-code search.
- **Interactive JSON Table Unroller**: Convert nested JSON arrays and API responses into flat interactive tables with nested object drawers.
- **Smart Duplicate Merging**: Automatically detect unique identifier columns (e.g., `id`, `uuid`, `customer_id`, `email`) and collapse redundant pagination calls into single composite rows.
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
HarLens/
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

## Usage Guide

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

---

## Author

**Faysal Alibrahim**  
GitHub: [https://github.com/FAYSAL-Q8](https://github.com/FAYSAL-Q8)

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
