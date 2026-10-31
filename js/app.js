/**
 * Author: Faysal Alibrahim
 * GitHub: https://github.com/FAYSAL-Q8
 */

const Native = {
  toast: (msg) => {
    if (window.AndroidBridge?.showToast) {
      window.AndroidBridge.showToast(msg);
    } else {
      showWebToast(msg);
    }
  },
  copy: async (text) => {
    try {
      if (window.AndroidBridge?.copyToClipboard) {
        window.AndroidBridge.copyToClipboard(text);
      } else {
        await navigator.clipboard.writeText(text);
      }
      Native.toast("Copied to clipboard!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      Native.toast("Copied to clipboard!");
    }
  },
  vibrate: (ms = 50) => {
    if (window.AndroidBridge?.vibrate) window.AndroidBridge.vibrate(ms);
    else if (navigator.vibrate) navigator.vibrate(ms);
  },
  share: (title, text) => {
    if (window.AndroidBridge?.shareText) window.AndroidBridge.shareText(title, text);
    else if (navigator.share) navigator.share({ title, text });
    else Native.copy(text);
  },
  saveData: (key, value) => {
    if (window.AndroidBridge?.saveData) window.AndroidBridge.saveData(key, value);
    else localStorage.setItem(key, value);
  },
  getData: (key) => {
    if (window.AndroidBridge?.getData) return window.AndroidBridge.getData(key);
    return localStorage.getItem(key);
  }
};

function showWebToast(msg) {
  let toastEl = document.getElementById('webToast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'webToast';
    toastEl.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--surface, #161a23);color:var(--primary, #00e599);border:1px solid var(--border, rgba(0,229,153,0.3));padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.5);transition:opacity 0.2s;opacity:0;pointer-events:none;';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.style.opacity = '1';
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => {
    toastEl.style.opacity = '0';
  }, 2200);
}

function initTheme() {
  const saved = Native.getData('app_theme') || localStorage.getItem('app_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(saved);

  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SET_THEME') {
      applyTheme(e.data.theme);
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'app_theme' && e.newValue) {
      applyTheme(e.newValue);
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.classList.toggle('dark', theme === 'dark');
  Native.saveData('app_theme', theme);
  localStorage.setItem('app_theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  Native.vibrate(30);
  Native.toast(`Switched to ${next} mode`);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (!icon) return;
  if (theme === 'dark') {
    icon.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`;
  } else {
    icon.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`;
  }
}

function normalizeText(text) {
  if (!text) return '';
  let str = String(text);
  str = str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
    try { return String.fromCharCode(parseInt(hex, 16)); } catch { return _; }
  });
  str = str.replace(/&#(\d+);/g, (_, dec) => {
    try { return String.fromCharCode(parseInt(dec, 10)); } catch { return _; }
  });
  str = str.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try { return String.fromCharCode(parseInt(hex, 16)); } catch { return _; }
  });
  if (str.includes('%')) {
    try { str = decodeURIComponent(str); } catch {}
  }
  str = str.replace(/[\u064B-\u065F\u0670]/g, '');
  str = str.replace(/[أإآٱ]/g, 'ا');
  str = str.replace(/ة/g, 'ه');
  str = str.replace(/ى/g, 'ي');
  return str.toLowerCase().trim();
}

function atobSafe(base64Str) {
  if (!base64Str) return '';
  try {
    const cleanStr = base64Str.replace(/\s/g, '');
    const binary = atob(cleanStr);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    try {
      return atob(base64Str.replace(/\s/g, ''));
    } catch {
      return '';
    }
  }
}

// JSON Syntax Highlighting & 1-Click Copyable Values
function escapeHtmlAttr(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function copyJsonVal(element, event) {
  if (event) {
    event.stopPropagation();
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) return;
  }
  const val = element.getAttribute('data-val') ?? element.textContent;
  Native.copy(val);
  Native.vibrate(20);

  element.classList.add('copied');
  clearTimeout(element._copiedTimer);
  element._copiedTimer = setTimeout(() => {
    element.classList.remove('copied');
  }, 1400);
}

function syntaxHighlightJson(json) {
  let str = json;
  if (typeof str !== 'string') {
    try {
      str = JSON.stringify(str, null, 2);
    } catch {
      str = String(str);
    }
  }
  if (!str) return '';

  const escaped = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        // Key / Attribute
        const keyText = match.slice(0, match.lastIndexOf(':'));
        return `<span class="json-key">${keyText}</span>:`;
      } else {
        // String value (strip outer quotes for copying)
        const unquoted = match.slice(1, -1);
        return `<span class="json-val json-val-string" data-val="${escapeHtmlAttr(unquoted)}" onclick="copyJsonVal(this, event)" title="Click to copy: ${escapeHtmlAttr(unquoted)}">${match}</span>`;
      }
    } else if (/true|false/.test(match)) {
      return `<span class="json-val json-val-boolean" data-val="${escapeHtmlAttr(match)}" onclick="copyJsonVal(this, event)" title="Click to copy: ${escapeHtmlAttr(match)}">${match}</span>`;
    } else if (/null/.test(match)) {
      return `<span class="json-val json-val-null" data-val="null" onclick="copyJsonVal(this, event)" title="Click to copy: null">${match}</span>`;
    } else {
      // Number
      return `<span class="json-val json-val-number" data-val="${escapeHtmlAttr(match)}" onclick="copyJsonVal(this, event)" title="Click to copy: ${escapeHtmlAttr(match)}">${match}</span>`;
    }
  });
}

// Application State
let importedArchives = []; // Array of { id, name, size, entries }
let activeArchiveId = 'ALL'; // 'ALL' or specific archive ID
let harEntries = []; // Active entries currently displayed
let deletedIds = new Set();
let viewMode = 'flat'; // 'flat' | 'domain' | 'path' | 'diagram'
let selectedEntry = null;
let currentDetailTab = 'preview'; // Default: Native Format-First!
let currentAssetTypeFilter = 'ALL';
let collapsedGroups = new Set();
let activeCombinerTab = 'prepared'; // 'prepared' | 'custom'

// Multi-Selection & Visited Requests State
let selectedRequestIds = new Set();
let seenRequestIds = new Set();

// Active Code Search State
let codeSearchMatches = [];
let currentCodeSearchIndex = -1;

// Active Table States (Detail Inspector, Combiner, and Selected Traffics)
let activeTableState = {
  rawRecords: [],
  baseFlattenedRecords: [],
  flattenedRecords: [],
  allColumns: [],
  excludedColumns: new Set(),
  sortCol: null,
  sortAsc: true,
  searchQuery: '',
  columnWidths: {},
  expandedRowIndices: new Set(),
  mergeDuplicates: false,
  mergeKeyCol: '',
  mergedGroupsMap: new Map()
};

let combinerTableState = null;
let selectedTableState = null;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSeenRequests();
  setupDropzone();
  setupFilterListeners();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDetailModal();
    closeCombinerModal();
    closeSelectedTableModal();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('filterSearch');
    if (searchInput) searchInput.focus();
  }
});

// Seen / Visited Requests Tracker (Session Cached)
function initSeenRequests() {
  try {
    const raw = sessionStorage.getItem('har_seen_requests');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) seenRequestIds = new Set(arr);
    }
  } catch {}
}

function markRequestSeen(id) {
  if (!id || seenRequestIds.has(id)) return;
  seenRequestIds.add(id);
  try {
    sessionStorage.setItem('har_seen_requests', JSON.stringify(Array.from(seenRequestIds)));
  } catch {}
  const el = document.querySelector(`.request-item[data-id="${id}"]`);
  if (el && !el.classList.contains('seen-request')) {
    el.classList.add('seen-request');
    const badge = el.querySelector('.seen-badge');
    if (!badge) {
      const statusTag = el.querySelector('.status-tag');
      if (statusTag) {
        const span = document.createElement('span');
        span.className = 'seen-badge';
        span.textContent = 'Seen';
        statusTag.insertAdjacentElement('afterend', span);
      }
    }
  }
}

// Dropzone & File Loading (supports multiple files)
function setupDropzone() {
  const dropzone = document.getElementById('harDropzone');
  const fileInput = document.getElementById('harFileInput');

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      loadMultipleHarFiles(Array.from(e.target.files));
      fileInput.value = '';
    }
  });

  window.addEventListener('dragover', (e) => e.preventDefault());
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files.length) {
      loadMultipleHarFiles(Array.from(e.dataTransfer.files));
    }
  });
}

function loadMultipleHarFiles(files) {
  if (!files || !files.length) return;
  let loadedCount = 0;
  let errorCount = 0;
  const total = files.length;

  const onFinish = () => {
    loadedCount++;
    if (loadedCount === total) {
      syncActiveArchive();
      const successCount = total - errorCount;
      if (successCount > 0) {
        Native.toast(`Loaded ${successCount} archive file(s)`);
        Native.vibrate(40);
      }
    }
  };

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        addArchiveToStore(e.target.result, file.name, file.size);
      } catch (err) {
        errorCount++;
        Native.toast(`Error in ${file.name}: ${err.message}`);
      }
      onFinish();
    };
    reader.onerror = () => {
      errorCount++;
      Native.toast(`Failed to read file: ${file.name}`);
      onFinish();
    };
    reader.readAsText(file);
  });
}

// Resilient URL Parser (handles malformed, relative, and reverse-engineered URLs)
function safeParseUrl(rawUrl) {
  if (!rawUrl) return { host: 'unknown', pathname: '/', search: '', basePath: '/' };
  try {
    const u = new URL(rawUrl);
    const segs = u.pathname.split('/').filter(Boolean);
    const basePath = segs.length > 0 ? '/' + segs[0] : '/';
    return {
      host: u.host || 'unknown',
      pathname: u.pathname || '/',
      search: u.search || '',
      basePath: basePath
    };
  } catch {
    // Relative or malformed fallback
    let clean = String(rawUrl).trim();
    if (clean.startsWith('//')) clean = 'http:' + clean;
    else if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://localhost/' + clean.replace(/^\/+/, '');
    }
    try {
      const u = new URL(clean);
      const segs = u.pathname.split('/').filter(Boolean);
      const basePath = segs.length > 0 ? '/' + segs[0] : '/';
      return {
        host: u.host === 'localhost' ? 'relative-url' : u.host,
        pathname: u.pathname,
        search: u.search,
        basePath: basePath
      };
    } catch {
      return { host: 'unknown', pathname: rawUrl, search: '', basePath: '/' };
    }
  }
}

// Determine Asset Type & Format Metadata
function detectAssetType(mime, url) {
  const m = (mime || '').toLowerCase();
  const u = (url || '').toLowerCase();

  if (u.endsWith('.php') || u.includes('.php?') || m.includes('php')) return 'php';
  if (m.includes('json') || u.endsWith('.json')) return 'json';
  if (m.includes('html') || u.endsWith('.html') || u.endsWith('.htm')) return 'html';
  if (m.includes('javascript') || m.includes('ecmascript') || u.endsWith('.js')) return 'js';
  if (m.includes('css') || u.endsWith('.css')) return 'css';
  if (m.includes('image') || /\.(png|jpe?g|gif|svg|webp|ico)($|\?)/.test(u)) return 'img';
  if (m.includes('pdf') || u.endsWith('.pdf')) return 'pdf';
  if (m.includes('spreadsheet') || m.includes('excel') || m.includes('csv') || /\.(xlsx|xls|csv)($|\?)/.test(u)) return 'xlsx';
  if (m.includes('audio') || m.includes('video') || /\.(mp4|mp3|wav|ogg|webm)($|\?)/.test(u)) return 'media';
  if (m.includes('font') || /\.(woff2?|ttf|otf|eot)($|\?)/.test(u)) return 'font';
  return 'other';
}

function parseArchiveEntries(jsonString, archiveId, archiveName) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Unable to parse JSON");
  }

  let rawEntries = [];
  if (parsed.log && Array.isArray(parsed.log.entries)) {
    rawEntries = parsed.log.entries;
  } else if (Array.isArray(parsed)) {
    rawEntries = parsed;
  } else if (parsed.entries && Array.isArray(parsed.entries)) {
    rawEntries = parsed.entries;
  } else {
    throw new Error("HAR format missing log.entries array");
  }

  rawEntries = rawEntries.filter(entry => entry && typeof entry === 'object');

  return rawEntries.map((entry, index) => {
    const req = entry.request || {};
    const res = entry.response || {};
    const parsedUrl = safeParseUrl(req.url);
    const mime = (res.content?.mimeType || '').toLowerCase();
    const type = detectAssetType(mime, req.url);

    let responseText = '';
    if (type !== 'img' && type !== 'media' && type !== 'font') {
      const rawText = res.content?.text || '';
      if (res.content?.encoding === 'base64') {
        responseText = atobSafe(rawText);
      } else {
        responseText = rawText;
      }
      if (responseText.length > 100000) {
        responseText = responseText.slice(0, 100000);
      }
    }

    const postText = req.postData?.text || '';

    // Build Deep Global Search Corpus
    const corpusPieces = [
      archiveName,
      req.method,
      req.url,
      parsedUrl.host,
      parsedUrl.pathname,
      parsedUrl.search,
      String(res.status || ''),
      res.statusText || '',
      mime,
      postText,
      responseText
    ];

    if (Array.isArray(req.headers)) {
      req.headers.forEach(h => corpusPieces.push(h.name, h.value));
    }
    if (Array.isArray(res.headers)) {
      res.headers.forEach(h => corpusPieces.push(h.name, h.value));
    }
    if (Array.isArray(req.queryString)) {
      req.queryString.forEach(q => corpusPieces.push(q.name, q.value));
    }
    if (Array.isArray(req.cookies)) {
      req.cookies.forEach(c => corpusPieces.push(c.name, c.value));
    }

    const searchCorpus = normalizeText(corpusPieces.join(' '));

    return {
      id: `${archiveId}_${index}`,
      archiveId: archiveId,
      archiveName: archiveName,
      method: (req.method || 'GET').toUpperCase(),
      url: req.url || '',
      host: parsedUrl.host,
      pathname: parsedUrl.pathname + parsedUrl.search,
      rawPathname: parsedUrl.pathname,
      basePath: parsedUrl.basePath,
      status: res.status || 0,
      statusText: res.statusText || '',
      time: Math.round(entry.time || 0),
      size: res.content?.size || res.bodySize || 0,
      mime: mime,
      category: type,
      type: type,
      request: req,
      response: res,
      serverIPAddress: entry.serverIPAddress || '',
      timings: entry.timings || {},
      searchCorpus: searchCorpus
    };
  });
}

function addArchiveToStore(jsonString, fileName, fileSize) {
  const archiveId = 'arc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const entries = parseArchiveEntries(jsonString, archiveId, fileName);

  importedArchives.push({
    id: archiveId,
    name: fileName,
    size: fileSize,
    entries: entries
  });
}

// Synchronize Active Archive View
function syncActiveArchive() {
  if (!importedArchives.length) {
    clearAllArchives();
    return;
  }

  // Combine or filter
  if (activeArchiveId === 'ALL' || !importedArchives.some(a => a.id === activeArchiveId)) {
    activeArchiveId = 'ALL';
    harEntries = importedArchives.flatMap(a => a.entries);
  } else {
    const selectedArc = importedArchives.find(a => a.id === activeArchiveId);
    harEntries = selectedArc ? selectedArc.entries : [];
  }

  // Auto-collapse groups
  const domains = new Set(harEntries.map(e => e.host));
  domains.forEach(d => collapsedGroups.add('domain:' + d));
  const paths = new Set(harEntries.map(e => e.basePath));
  paths.forEach(p => collapsedGroups.add('path:' + p));

  document.getElementById('harDropzone').style.display = 'none';
  const seoSec = document.getElementById('seoOverviewSection');
  if (seoSec) seoSec.style.display = 'none';
  document.getElementById('harViewerContent').style.display = 'flex';
  document.getElementById('combinerNavBtn').style.display = 'inline-flex';

  renderArchivesBar();
  updateArchiveLabel();
  updateRestoreButton();
  updatePreparedPathsBadge();
  updateMetrics();
  renderCurrentView();
}

// Multi-Archive Switcher Bar
function renderArchivesBar() {
  const bar = document.getElementById('archivesBar');
  if (!bar) return;

  const totalReqs = importedArchives.reduce((sum, a) => sum + a.entries.length, 0);

  const chips = [];
  // "All Combined" option
  chips.push(`
    <div class="archive-chip ${activeArchiveId === 'ALL' ? 'active' : ''}" onclick="switchActiveArchive('ALL')">
      <span>🔗 All Combined (${totalReqs})</span>
    </div>
  `);

  // Individual archive chips
  importedArchives.forEach(arc => {
    chips.push(`
      <div class="archive-chip ${activeArchiveId === arc.id ? 'active' : ''}" onclick="switchActiveArchive('${arc.id}')">
        <span title="${escapeHtml(arc.name)}">${escapeHtml(arc.name)} (${arc.entries.length})</span>
        <span class="archive-chip-close" onclick="event.stopPropagation(); deleteArchive('${arc.id}')" title="Remove this archive">✕</span>
      </div>
    `);
  });

  bar.innerHTML = chips.join('');
}

function switchActiveArchive(arcId) {
  activeArchiveId = arcId;
  syncActiveArchive();
  Native.vibrate(20);
}

function deleteArchive(arcId) {
  const arc = importedArchives.find(a => a.id === arcId);
  importedArchives = importedArchives.filter(a => a.id !== arcId);
  if (activeArchiveId === arcId) {
    activeArchiveId = 'ALL';
  }
  syncActiveArchive();
  // Prune any selection IDs that no longer exist
  selectedRequestIds.forEach(id => {
    if (!harEntries.some(e => e.id === id)) selectedRequestIds.delete(id);
  });
  updateSelectionActionBar();
  Native.toast(`Removed ${arc ? arc.name : 'archive'}`);
  Native.vibrate(30);
}

function clearAllArchives() {
  importedArchives = [];
  harEntries = [];
  deletedIds.clear();
  selectedRequestIds.clear();
  selectedPreparedPaths.clear();
  selectedEntry = null;
  activeArchiveId = 'ALL';
  updateSelectionActionBar();
  updatePreparedPathsSelectionUI();
  document.getElementById('harFileInput').value = '';
  document.getElementById('harDropzone').style.display = 'flex';
  const seoSec = document.getElementById('seoOverviewSection');
  if (seoSec) seoSec.style.display = 'block';
  document.getElementById('harViewerContent').style.display = 'none';
  document.getElementById('combinerNavBtn').style.display = 'none';
  updateRestoreButton();
  updatePreparedPathsBadge();
  closeDetailModal();
  closeCombinerModal();
  closeSelectedTableModal();
  Native.vibrate(20);
}

function updateArchiveLabel() {
  const label = document.getElementById('archiveLabel');
  if (activeArchiveId === 'ALL') {
    label.textContent = `All Imported Archives (${importedArchives.length} files • ${harEntries.length} total calls)`;
  } else {
    const arc = importedArchives.find(a => a.id === activeArchiveId);
    label.textContent = arc ? `${arc.name} (${arc.entries.length} calls)` : 'Archive';
  }
}

// Global Deletion Synchronization
function deleteRequest(id) {
  deletedIds.add(id);
  updateRestoreButton();
  updatePreparedPathsBadge();
  updateMetrics();
  renderCurrentView();
  Native.toast("Request suppressed globally");
  Native.vibrate(30);
}

function deleteCurrentRequest() {
  if (selectedEntry) {
    const id = selectedEntry.id;
    closeDetailModal();
    deleteRequest(id);
  }
}

function deleteDomainGroup(domain) {
  const toDelete = harEntries.filter(e => e.host === domain && !deletedIds.has(e.id));
  toDelete.forEach(e => deletedIds.add(e.id));
  updateRestoreButton();
  updatePreparedPathsBadge();
  updateMetrics();
  renderCurrentView();
  Native.toast(`Suppressed ${toDelete.length} requests in domain ${domain}`);
  Native.vibrate(40);
}

function deleteBasePathGroup(basePath) {
  const toDelete = harEntries.filter(e => e.basePath === basePath && !deletedIds.has(e.id));
  toDelete.forEach(e => deletedIds.add(e.id));
  updateRestoreButton();
  updatePreparedPathsBadge();
  updateMetrics();
  renderCurrentView();
  Native.toast(`Suppressed ${toDelete.length} requests under path ${basePath}`);
  Native.vibrate(40);
}

function restoreAllDeleted() {
  const count = deletedIds.size;
  deletedIds.clear();
  updateRestoreButton();
  updatePreparedPathsBadge();
  updateMetrics();
  renderCurrentView();
  Native.toast(`Restored ${count} suppressed requests`);
  Native.vibrate(30);
}

function updateRestoreButton() {
  const btn = document.getElementById('restoreDeletedBtn');
  const countSpan = document.getElementById('deletedCount');
  if (deletedIds.size > 0) {
    btn.style.display = 'inline-flex';
    countSpan.textContent = deletedIds.size;
  } else {
    btn.style.display = 'none';
  }
}

// Metrics
function updateMetrics() {
  const active = harEntries.filter(e => !deletedIds.has(e.id));
  const total = active.length;
  const failed = active.filter(e => e.status >= 400 || e.status === 0).length;
  const totalBytes = active.reduce((sum, e) => sum + e.size, 0);
  const totalTime = active.reduce((sum, e) => sum + e.time, 0);

  document.getElementById('metricTotal').textContent = harEntries.length;
  document.getElementById('metricVisible').textContent = total;
  document.getElementById('metricFailed').textContent = failed;
  document.getElementById('metricSize').textContent = formatBytes(totalBytes);
  document.getElementById('metricTime').textContent = `${(totalTime / 1000).toFixed(2)}s`;
}

// View Mode Switching
function setViewMode(mode) {
  viewMode = mode;
  document.querySelectorAll('.seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  const groupBtns = document.getElementById('groupControlBtns');
  groupBtns.style.display = (mode === 'domain' || mode === 'path') ? 'flex' : 'none';

  const listSection = document.getElementById('requestsList');
  const diagramSection = document.getElementById('diagramView');

  if (mode === 'diagram') {
    listSection.style.display = 'none';
    diagramSection.style.display = 'block';
  } else {
    listSection.style.display = 'flex';
    diagramSection.style.display = 'none';
  }

  renderCurrentView();
  Native.vibrate(20);
}

function expandAllGroups() {
  collapsedGroups.clear();
  renderCurrentView();
}

function collapseAllGroups() {
  if (viewMode === 'domain') {
    const domains = new Set(harEntries.map(e => e.host));
    domains.forEach(d => collapsedGroups.add('domain:' + d));
  } else if (viewMode === 'path') {
    const paths = new Set(harEntries.map(e => e.basePath));
    paths.forEach(p => collapsedGroups.add('path:' + p));
  }
  renderCurrentView();
}

function toggleGroupCollapse(key) {
  if (collapsedGroups.has(key)) {
    collapsedGroups.delete(key);
  } else {
    collapsedGroups.add(key);
  }
  renderCurrentView();
}

let searchDebounceTimer = null;
function debouncedRenderCurrentView() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(renderCurrentView, 120);
}

function setupFilterListeners() {
  document.getElementById('filterSearch').addEventListener('input', debouncedRenderCurrentView);
  document.getElementById('filterMethod').addEventListener('change', renderCurrentView);
  document.getElementById('filterStatus').addEventListener('change', renderCurrentView);
}

function setAssetTypeFilter(type) {
  currentAssetTypeFilter = type;
  document.querySelectorAll('#assetCategoryPills .cat-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  renderCurrentView();
}

// Filter Pipeline (Deep Search + Methods + Status + Asset Type + Global Deletions)
function getFilteredEntries() {
  const rawSearch = document.getElementById('filterSearch').value.trim();
  const searchNormalized = normalizeText(rawSearch);
  const searchTerms = searchNormalized ? searchNormalized.split(/\s+/).filter(Boolean) : [];

  const methodFilter = document.getElementById('filterMethod').value;
  const statusFilter = document.getElementById('filterStatus').value;
  const typeFilter = currentAssetTypeFilter;

  return harEntries.filter(e => {
    // Permanent global deletion check
    if (deletedIds.has(e.id)) return false;

    // Method filter
    if (methodFilter !== 'ALL' && e.method !== methodFilter) return false;

    // Status filter
    if (statusFilter !== 'ALL') {
      const code = e.status;
      if (statusFilter === '2xx' && (code < 200 || code >= 300)) return false;
      if (statusFilter === '3xx' && (code < 300 || code >= 400)) return false;
      if (statusFilter === '4xx' && (code < 400 || code >= 500)) return false;
      if (statusFilter === '5xx' && (code < 500 || code >= 600)) return false;
      if (statusFilter === 'ERR' && code !== 0 && code < 400) return false;
    }

    // Asset Category Pill Filter
    if (typeFilter !== 'ALL') {
      if (e.category !== typeFilter) return false;
    }

    // Deep Search: Multi-term matching across entire normalized corpus
    if (searchTerms.length > 0) {
      const matchAll = searchTerms.every(term => e.searchCorpus.includes(term));
      if (!matchAll) return false;
    }

    return true;
  });
}

function renderCurrentView() {
  const filtered = getFilteredEntries();
  const listContainer = document.getElementById('requestsList');
  const diagramContainer = document.getElementById('diagramView');

  if (viewMode === 'flat') {
    renderFlatView(filtered, listContainer);
  } else if (viewMode === 'domain') {
    renderGroupedView(filtered, listContainer, 'domain');
  } else if (viewMode === 'path') {
    renderGroupedView(filtered, listContainer, 'path');
  } else if (viewMode === 'diagram') {
    renderDiagramView(filtered, diagramContainer);
  }

  updateSelectionActionBar();
}

// Selection & Batch Action Management
function toggleSelectRequest(id, isSelected) {
  if (isSelected) {
    selectedRequestIds.add(id);
  } else {
    selectedRequestIds.delete(id);
  }
  updateSelectionActionBar();
  Native.vibrate(15);
}

function updateSelectionActionBar() {
  const bar = document.getElementById('selectionActionBar');
  const countBadge = document.getElementById('selectedCountBadge');
  const countText = document.getElementById('selectedCountText');
  if (!bar) return;

  const count = selectedRequestIds.size;
  if (count > 0) {
    bar.style.display = 'flex';
    if (countBadge) countBadge.textContent = count;
    if (countText) countText.textContent = count === 1 ? 'call selected' : 'calls selected';
  } else {
    bar.style.display = 'none';
  }
}

function selectAllVisibleRequests(select) {
  const visible = getFilteredEntries();
  visible.forEach(e => {
    if (select) {
      selectedRequestIds.add(e.id);
    } else {
      selectedRequestIds.delete(e.id);
    }
  });

  document.querySelectorAll('.req-select-checkbox').forEach(cb => {
    const id = cb.dataset.id;
    if (id) cb.checked = selectedRequestIds.has(id);
  });

  updateSelectionActionBar();
  Native.toast(select ? `Selected ${visible.length} visible calls` : 'Cleared selections');
  Native.vibrate(25);
}

function clearSelectedRequests() {
  selectedRequestIds.clear();
  document.querySelectorAll('.req-select-checkbox').forEach(cb => {
    cb.checked = false;
  });
  updateSelectionActionBar();
  Native.toast("Selection cleared");
  Native.vibrate(20);
}

function deleteSelectedRequests() {
  if (!selectedRequestIds.size) return;
  const count = selectedRequestIds.size;
  selectedRequestIds.forEach(id => deletedIds.add(id));
  selectedRequestIds.clear();
  updateSelectionActionBar();
  updateRestoreButton();
  updatePreparedPathsBadge();
  updateMetrics();
  renderCurrentView();
  Native.toast(`Suppressed ${count} selected requests`);
  Native.vibrate(35);
}

// Flat View Renderer
function renderFlatView(entries, container) {
  if (!entries.length) {
    container.innerHTML = `<div class="empty-state">No matching requests found</div>`;
    return;
  }

  container.innerHTML = entries.map(e => createRequestRowHtml(e)).join('');
}

// Grouped View (By Domain or Base Path)
function updateGroupControls(groupsCount, callsCount, groupType = 'path') {
  const badge = document.getElementById('groupSummaryBadge');
  if (badge) {
    const label = groupType === 'domain' ? 'domains' : 'paths';
    badge.textContent = `${groupsCount} ${label} (${callsCount} calls)`;
  }
}

function toggleSelectGroup(groupType, groupName, select) {
  const targetReqs = harEntries.filter(e => {
    if (deletedIds.has(e.id)) return false;
    return groupType === 'domain' ? e.host === groupName : e.basePath === groupName;
  });

  targetReqs.forEach(e => {
    if (select) {
      selectedRequestIds.add(e.id);
    } else {
      selectedRequestIds.delete(e.id);
    }
  });

  document.querySelectorAll('.req-select-checkbox').forEach(cb => {
    const id = cb.dataset.id;
    if (id) cb.checked = selectedRequestIds.has(id);
  });

  updateSelectionActionBar();
  Native.toast(select ? `Selected all ${targetReqs.length} calls in ${groupName}` : `Deselected ${groupName}`);
  Native.vibrate(20);
}

function renderGroupedView(entries, container, groupType) {
  if (!entries.length) {
    container.innerHTML = `<div class="empty-state">No matching requests found</div>`;
    updateGroupControls(0, 0, groupType);
    return;
  }

  // 1. Group requests by domain or basePath
  const groups = new Map();
  entries.forEach(e => {
    const key = groupType === 'domain' ? (e.host || 'unknown-host') : (e.basePath || '/');
    if (!groups.has(key)) {
      groups.set(key, {
        name: key,
        items: [],
        errorsCount: 0,
        totalBytes: 0
      });
    }
    const g = groups.get(key);
    g.items.push(e);
    if (e.status >= 400 || e.status === 0) g.errorsCount++;
    g.totalBytes += (e.size || 0);
  });

  // 2. Filter groups by groupFilterSearch
  const groupFilterInput = document.getElementById('groupFilterSearch');
  const groupQuery = groupFilterInput ? normalizeText(groupFilterInput.value) : '';
  let groupList = Array.from(groups.values());

  if (groupQuery) {
    groupList = groupList.filter(g => normalizeText(g.name).includes(groupQuery));
  }

  // 3. Sort groups
  const sortOption = document.getElementById('groupSortSelect')?.value || 'count_desc';
  if (sortOption === 'count_desc') {
    groupList.sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
  } else if (sortOption === 'name_asc') {
    groupList.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOption === 'errors_desc') {
    groupList.sort((a, b) => b.errorsCount - a.errorsCount || b.items.length - a.items.length);
  }

  updateGroupControls(groupList.length, entries.length, groupType);

  if (!groupList.length) {
    container.innerHTML = `<div class="empty-state">No ${groupType === 'domain' ? 'domains' : 'paths'} matching "${escapeHtml(groupQuery)}"</div>`;
    return;
  }

  const html = [];
  const domainIconSvg = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:13px;height:13px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/></svg>`;
  const pathIconSvg = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:13px;height:13px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>`;
  const chevronSvg = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:12px;height:12px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>`;

  for (const group of groupList) {
    const collapseKey = `${groupType}:${group.name}`;
    const isExpanded = !collapsedGroups.has(collapseKey);
    const allGroupSelected = group.items.length > 0 && group.items.every(e => selectedRequestIds.has(e.id));

    html.push(`
      <div class="group-section ${isExpanded ? 'expanded' : ''}" data-group="${escapeHtmlAttr(collapseKey)}">
        <div class="group-header" onclick="toggleGroupCollapse('${escapeHtml(collapseKey)}')">
          <div class="group-title-box">
            <!-- Group Checkbox for batch select -->
            <div class="req-check-wrap" onclick="event.stopPropagation()" title="Select/Deselect all ${group.items.length} calls in this group">
              <input type="checkbox" class="req-select-checkbox group-select-checkbox" ${allGroupSelected ? 'checked' : ''} onchange="toggleSelectGroup('${groupType}', '${escapeHtmlAttr(group.name)}', this.checked)" />
            </div>

            <span class="group-arrow">${chevronSvg}</span>

            <div class="group-icon">
              ${groupType === 'domain' ? domainIconSvg : pathIconSvg}
            </div>

            <span class="group-name" title="${escapeHtml(group.name)}">${escapeHtml(group.name)}</span>

            <div class="group-badges">
              <span class="group-count" title="${group.items.length} requests in this group">${group.items.length} calls</span>
              ${group.errorsCount > 0 ? `<span class="group-err-badge" title="${group.errorsCount} failed calls">${group.errorsCount} errors</span>` : ''}
              <span class="group-size-badge" title="Total payload transferred">${formatBytes(group.totalBytes)}</span>
            </div>
          </div>

          <div class="group-actions" onclick="event.stopPropagation()">
            <button class="btn btn-sm btn-danger" onclick="${groupType === 'domain' ? `deleteDomainGroup('${escapeHtml(group.name)}')` : `deleteBasePathGroup('${escapeHtml(group.name)}')`}" title="Suppress all requests in this group">
              Hide Group
            </button>
          </div>
        </div>
        <div class="group-content">
          ${group.items.map(e => createRequestRowHtml(e)).join('')}
        </div>
      </div>
    `);
  }

  container.innerHTML = html.join('');
}

// Render Request Item with Format Icon / Image Thumbnail
function getEntryIconHtml(e) {
  const content = e.response.content;
  // If image with base64, render actual image thumbnail!
  if (e.type === 'img' && content?.text && content.encoding === 'base64') {
    return `<img src="data:${e.mime || 'image/png'};base64,${content.text}" class="req-thumb" alt="thumbnail" />`;
  }

  // Type badges
  const labels = {
    html: 'HTML',
    php: 'PHP',
    css: 'CSS',
    js: 'JS',
    json: '{ }',
    img: 'IMG',
    pdf: 'PDF',
    xlsx: 'XLS',
    media: 'AV',
    font: 'Aa',
    other: 'FILE'
  };

  const label = labels[e.type] || 'BIN';
  return `<div class="req-type-icon req-icon-${e.type}" title="${e.type.toUpperCase()} file">${label}</div>`;
}

function createRequestRowHtml(e) {
  let statusClass = 'status-0';
  if (e.status >= 200 && e.status < 300) statusClass = 'status-2xx';
  else if (e.status >= 300 && e.status < 400) statusClass = 'status-3xx';
  else if (e.status >= 400 && e.status < 500) statusClass = 'status-4xx';
  else if (e.status >= 500) statusClass = 'status-5xx';

  const iconHtml = getEntryIconHtml(e);
  const archiveTag = importedArchives.length > 1
    ? `<span class="req-archive-tag" title="${escapeHtml(e.archiveName)}">${escapeHtml(e.archiveName)}</span>`
    : '';

  const isSeen = seenRequestIds.has(e.id);
  const isSelected = selectedRequestIds.has(e.id);
  const seenBadgeHtml = isSeen ? `<span class="seen-badge">Seen</span>` : '';

  return `
    <div class="request-item ${isSeen ? 'seen-request' : ''}" data-id="${e.id}" onclick="openDetail('${e.id}')">
      <div class="req-check-wrap" onclick="event.stopPropagation()" title="Select this request">
        <input type="checkbox" class="req-select-checkbox" data-id="${e.id}" ${isSelected ? 'checked' : ''} onchange="toggleSelectRequest('${e.id}', this.checked)" />
      </div>
      ${iconHtml}
      <span class="method-tag method-${e.method}">${e.method}</span>
      <span class="status-tag ${statusClass}">${e.status || 'ERR'}</span>
      ${seenBadgeHtml}
      <div class="req-url-box">
        <div style="display:flex;align-items:center;gap:4px;overflow:hidden;">
          <span class="req-path" title="${escapeHtml(e.url)}">${escapeHtml(e.pathname || e.url)}</span>
          ${archiveTag}
        </div>
        <span class="req-host">${escapeHtml(e.host || '')}</span>
      </div>
      <div class="req-meta-box">
        <span>${formatBytes(e.size)}</span>
        <span>${e.time}ms</span>
      </div>
      <button class="del-req-btn" onclick="event.stopPropagation(); deleteRequest('${e.id}')" title="Suppress this request">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `;
}

// Tree Diagram Visualization
function renderDiagramView(entries, container) {
  if (!entries.length) {
    container.innerHTML = `<div class="empty-state">No traffic entries to display in diagram.</div>`;
    return;
  }

  const domainMap = new Map();
  entries.forEach(e => {
    if (!domainMap.has(e.host)) domainMap.set(e.host, new Map());
    const pathMap = domainMap.get(e.host);
    if (!pathMap.has(e.basePath)) pathMap.set(e.basePath, []);
    pathMap.get(e.basePath).push(e);
  });

  const domainNodes = [];
  for (const [domain, pathMap] of domainMap.entries()) {
    const pathBranches = [];

    for (const [basePath, reqs] of pathMap.entries()) {
      const leaves = reqs.map(e => {
        let statusColor = '#00e599';
        if (e.status >= 400 || e.status === 0) statusColor = '#f43f5e';
        else if (e.status >= 300) statusColor = '#38bdf8';

        const isSeen = seenRequestIds.has(e.id);

        return `
          <div class="tree-req-leaf" style="${isSeen ? 'opacity:0.75; border-left:2px solid var(--text-dim);' : ''}" onclick="openDetail('${e.id}')" title="Click to inspect: ${escapeHtml(e.url)}">
            <span class="method-tag method-${e.method}" style="font-size:8.5px;padding:1px 3px;">${e.method}</span>
            <span style="color:${statusColor};font-weight:700;">${e.status || 'ERR'}</span>
            ${isSeen ? '<span class="seen-badge" style="font-size:8px;padding:0 3px;">Seen</span>' : ''}
            <span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(e.rawPathname)}</span>
            <span style="color:var(--text-dim);font-size:9.5px;">(${formatBytes(e.size)})</span>
          </div>
        `;
      }).join('');

      pathBranches.push(`
        <div class="tree-path-branch">
          <div class="tree-path-header">
            <span>↳ ${escapeHtml(basePath)}</span>
            <span class="group-count">${reqs.length}</span>
          </div>
          <div class="tree-req-leaves">
            ${leaves}
          </div>
        </div>
      `);
    }

    domainNodes.push(`
      <div class="tree-domain-node">
        <div class="tree-domain-title">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
          </svg>
          <span>${escapeHtml(domain)}</span>
        </div>
        ${pathBranches.join('')}
      </div>
    `);
  }

  container.innerHTML = `
    <div class="diagram-tree">
      ${domainNodes.join('')}
    </div>
  `;
}

// Native Format-First Detail Inspector
function openDetail(id) {
  markRequestSeen(id);
  selectedEntry = harEntries.find(e => e.id === id);
  if (!selectedEntry) return;

  const e = selectedEntry;
  document.getElementById('detailTitle').textContent = `${e.host} ${e.pathname}`;
  document.getElementById('detailMethodTag').textContent = e.method;
  document.getElementById('detailMethodTag').className = `method-tag method-${e.method}`;

  const statusTag = document.getElementById('detailStatusTag');
  statusTag.textContent = e.status || 'ERR';
  let sClass = 'status-0';
  if (e.status >= 200 && e.status < 300) sClass = 'status-2xx';
  else if (e.status >= 300 && e.status < 400) sClass = 'status-3xx';
  else if (e.status >= 400 && e.status < 500) sClass = 'status-4xx';
  else if (e.status >= 500) sClass = 'status-5xx';
  statusTag.className = `status-tag ${sClass}`;

  // Update type icon in modal header
  document.getElementById('detailTypeIconSlot').innerHTML = getEntryIconHtml(e);

  // Configure special tab availability
  const isJson = e.type === 'json' || (e.mime && e.mime.includes('json'));
  document.getElementById('jsonTableTabBtn').style.display = isJson ? 'inline-block' : 'none';

  // Customize Preview Tab Label based on format
  const previewTabBtn = document.getElementById('detailTabPreviewBtn');
  if (e.type === 'html') previewTabBtn.textContent = 'Rendered Webpage';
  else if (e.type === 'img') previewTabBtn.textContent = 'Image Preview';
  else if (e.type === 'pdf') previewTabBtn.textContent = 'PDF Preview';
  else if (e.type === 'media') previewTabBtn.textContent = 'Media Player';
  else if (e.type === 'json') previewTabBtn.textContent = 'JSON View';
  else if (e.type === 'xlsx') previewTabBtn.textContent = 'Sheet Preview';
  else previewTabBtn.textContent = 'Format Preview';

  // Format-first architecture: default straight to Format Preview!
  currentDetailTab = 'preview';
  setDetailTab(currentDetailTab);

  document.getElementById('detailModal').classList.add('active');
  Native.vibrate(25);
}

function closeDetailModal() {
  document.getElementById('detailModal').classList.remove('active');
}

function setDetailTab(tabKey) {
  currentDetailTab = tabKey;
  document.querySelectorAll('#detailModal .detail-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabKey);
  });

  const body = document.getElementById('detailBody');
  if (!selectedEntry) return;

  if (tabKey === 'preview') renderPreviewTab(body);
  else if (tabKey === 'source') renderSourceTab(body);
  else if (tabKey === 'headers') renderHeadersTab(body);
  else if (tabKey === 'payload') renderPayloadTab(body);
  else if (tabKey === 'query') renderQueryTab(body);
  else if (tabKey === 'curl') renderCurlTab(body);
  else if (tabKey === 'table') renderJsonTableTab(body);
}

// Format-First Preview Tab Handler
function renderPreviewTab(container) {
  const e = selectedEntry;
  const content = e.response.content;

  if (!content || (!content.text && content.size === 0)) {
    container.innerHTML = `<div class="empty-state">No response body captured for this request.</div>`;
    return;
  }

  const mime = (content.mimeType || '').toLowerCase();

  // 1. Rendered Webpage (HTML)
  if (e.type === 'html') {
    let html = content.text || '';
    if (content.encoding === 'base64') html = atobSafe(html) || html;

    // Virtual asset injection from all imported archives
    const assetMap = new Map();
    harEntries.forEach(entry => {
      const c = entry.response.content;
      if (!c || !c.text) return;
      const m = c.mimeType || 'text/plain';
      const dataUri = c.encoding === 'base64'
        ? `data:${m};base64,${c.text}`
        : `data:${m};utf8,${encodeURIComponent(c.text)}`;
      assetMap.set(entry.url, dataUri);
      try {
        const u = new URL(entry.url);
        assetMap.set(u.pathname, dataUri);
        assetMap.set(u.pathname + u.search, dataUri);
      } catch {}
    });

    let injectedCount = 0;
    const rewrittenHtml = html.replace(/(src|href)=["']([^"']+)["']/gi, (match, attr, targetUrl) => {
      if (assetMap.has(targetUrl)) {
        injectedCount++;
        return `${attr}="${assetMap.get(targetUrl)}"`;
      }
      return match;
    });

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:4px;">
        <span class="virtual-asset-pill">✓ Webpage rendered with ${injectedCount} local HAR assets</span>
        <button class="btn btn-sm" onclick="setDetailTab('source')">View HTML Source</button>
      </div>
      <iframe class="replay-frame" sandbox="allow-scripts" srcdoc="${escapeHtmlAttr(rewrittenHtml)}"></iframe>
    `;
    return;
  }

  // 2. Direct Image Preview
  if (e.type === 'img') {
    const imgSrc = content.encoding === 'base64'
      ? `data:${mime};base64,${content.text}`
      : `data:${mime};utf8,${encodeURIComponent(content.text)}`;

    container.innerHTML = `
      <div class="media-preview-box">
        <img src="${imgSrc}" style="max-width:100%;max-height:360px;border-radius:6px;object-fit:contain;box-shadow:0 4px 16px rgba(0,0,0,0.3);" />
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;margin-top:6px;font-size:11px;color:var(--text-muted);">
          <span>${mime} • ${formatBytes(content.size)}</span>
          <button class="btn btn-sm btn-primary" onclick="downloadCurrentResponse()">Download Image</button>
        </div>
      </div>
    `;
    return;
  }

  // 3. Direct PDF Preview
  if (e.type === 'pdf') {
    const pdfSrc = content.encoding === 'base64'
      ? `data:application/pdf;base64,${content.text}`
      : `data:application/pdf;utf8,${encodeURIComponent(content.text)}`;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11.5px;color:var(--text-muted);font-weight:600;">PDF Document (${formatBytes(content.size)})</span>
          <button class="btn btn-sm btn-primary" onclick="downloadCurrentResponse()">Download PDF</button>
        </div>
        <iframe src="${pdfSrc}" style="width:100%;height:420px;border:1px solid var(--border);border-radius:6px;background:#fff;"></iframe>
      </div>
    `;
    return;
  }

  // 4. Audio / Video Media Player
  if (e.type === 'media') {
    const isVideo = mime.includes('video') || /\.(mp4|webm)($|\?)/.test(e.url);
    const mediaSrc = content.encoding === 'base64'
      ? `data:${mime};base64,${content.text}`
      : `data:${mime};utf8,${encodeURIComponent(content.text)}`;

    container.innerHTML = `
      <div class="media-preview-box">
        ${isVideo
          ? `<video controls src="${mediaSrc}" style="max-width:100%;max-height:320px;border-radius:6px;background:#000;"></video>`
          : `<audio controls src="${mediaSrc}" style="width:100%;margin:16px 0;"></audio>`}
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;font-size:11px;color:var(--text-muted);">
          <span>${mime} • ${formatBytes(content.size)}</span>
          <button class="btn btn-sm btn-primary" onclick="downloadCurrentResponse()">Download Media</button>
        </div>
      </div>
    `;
    return;
  }

  // 5. JSON View (Syntax-highlighted with 1-click copyable values)
  if (e.type === 'json' || mime.includes('json')) {
    let text = content.text;
    if (content.encoding === 'base64') text = atobSafe(text) || text;

    let parsedJson = null;
    try {
      parsedJson = JSON.parse(text);
    } catch {}

    if (parsedJson !== null) {
      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:4px;">
          <span style="color:var(--primary);">💡 Click any value to copy</span>
          <button class="btn btn-sm btn-primary" onclick="setDetailTab('table')">View as Interactive Table ➔</button>
        </div>
      `;

      const codeView = document.createElement('div');
      codeView.className = 'json-view';
      const highlightedHtml = syntaxHighlightJson(parsedJson);
      codeView.innerHTML = highlightedHtml;

      const rawJsonStr = JSON.stringify(parsedJson, null, 2);
      const searchBar = setupCodeSearch(codeView, rawJsonStr, highlightedHtml);
      container.appendChild(searchBar);
      container.appendChild(codeView);
      return;
    }
  }

  // 6. CSV / Spreadsheet Preview
  if (e.type === 'xlsx' || mime.includes('csv')) {
    let text = content.text;
    if (content.encoding === 'base64') text = atobSafe(text) || text;

    if (text && (mime.includes('csv') || e.url.endsWith('.csv'))) {
      const rows = text.split('\n').filter(r => r.trim()).map(r => r.split(','));
      if (rows.length > 0) {
        container.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;color:var(--text-muted);font-weight:600;">CSV Table Preview (${rows.length} rows)</span>
            <button class="btn btn-sm btn-primary" onclick="downloadCurrentResponse()">Download CSV</button>
          </div>
          <div class="table-wrap">
            <table class="records-table">
              <thead><tr>${rows[0].map(h => `<th>${escapeHtml(h.trim())}</th>`).join('')}</tr></thead>
              <tbody>${rows.slice(1, 100).map(r => `<tr>${r.map(c => `<td>${escapeHtml(c.trim())}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>
        `;
        return;
      }
    }
  }

  // 7. Binary / Unrecognized fallback with Download Button
  if (content.encoding === 'base64' && e.type === 'other') {
    container.innerHTML = `
      <div class="binary-preview-box">
        <svg class="binary-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
        <div style="font-weight:700;font-size:13px;color:var(--text-main);">${escapeHtml(e.rawPathname.split('/').pop() || 'binary_file')}</div>
        <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(mime || 'application/octet-stream')} • ${formatBytes(content.size)}</div>
        <button class="btn btn-primary" onclick="downloadCurrentResponse()">Download File</button>
      </div>
    `;
    return;
  }

  // 8. Text / Code fallback
  renderSourceTab(container);
}

// Source Tab (Raw Response Text / Code)
function renderSourceTab(container) {
  const e = selectedEntry;
  const content = e.response.content;

  if (!content || !content.text) {
    container.innerHTML = `<div class="empty-state">No source body captured.</div>`;
    return;
  }

  let text = content.text;
  if (content.encoding === 'base64') text = atobSafe(text) || text;

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:4px;">
      <span>MIME: ${escapeHtml(content.mimeType || 'text/plain')}</span>
      <span>${formatBytes(content.size || text.length)}</span>
    </div>
  `;

  const codeView = document.createElement('div');
  codeView.className = 'code-view';
  codeView.textContent = text;
  const searchBar = setupCodeSearch(codeView, text);
  container.appendChild(searchBar);
  container.appendChild(codeView);
}

// In-Viewer Code Search Toolbar
function setupCodeSearch(codeContainer, originalText, initialHtml = null) {
  codeSearchMatches = [];
  currentCodeSearchIndex = -1;

  const searchBar = document.createElement('div');
  searchBar.className = 'code-search-bar';
  searchBar.innerHTML = `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:13px;height:13px;color:var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
    <input type="search" class="code-search-input" placeholder="Search in code (Enter/Shift+Enter)..." />
    <span class="code-search-count">0 / 0</span>
    <button class="btn btn-sm" id="codeSearchPrev" title="Previous match">▲</button>
    <button class="btn btn-sm" id="codeSearchNext" title="Next match">▼</button>
  `;

  const input = searchBar.querySelector('.code-search-input');
  const countSpan = searchBar.querySelector('.code-search-count');
  const prevBtn = searchBar.querySelector('#codeSearchPrev');
  const nextBtn = searchBar.querySelector('#codeSearchNext');

  function doSearch(direction = 1) {
    const q = input.value;
    if (!q) {
      if (initialHtml) {
        codeContainer.innerHTML = initialHtml;
      } else {
        codeContainer.textContent = originalText;
      }
      countSpan.textContent = '0 / 0';
      codeSearchMatches = [];
      currentCodeSearchIndex = -1;
      return;
    }

    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQ})`, 'gi');

    const parts = originalText.split(regex);
    codeContainer.innerHTML = '';

    let matchIdx = 0;
    parts.forEach(part => {
      if (part.toLowerCase() === q.toLowerCase()) {
        const mark = document.createElement('mark');
        mark.className = 'code-match';
        mark.textContent = part;
        mark.dataset.matchIndex = matchIdx++;
        codeContainer.appendChild(mark);
      } else {
        codeContainer.appendChild(document.createTextNode(part));
      }
    });

    const marks = codeContainer.querySelectorAll('mark.code-match');
    codeSearchMatches = Array.from(marks);

    if (codeSearchMatches.length === 0) {
      countSpan.textContent = '0 / 0';
      currentCodeSearchIndex = -1;
      return;
    }

    if (currentCodeSearchIndex === -1) {
      currentCodeSearchIndex = 0;
    } else {
      currentCodeSearchIndex = (currentCodeSearchIndex + direction + codeSearchMatches.length) % codeSearchMatches.length;
    }

    highlightCurrentMatch(countSpan);
  }

  function highlightCurrentMatch(countSpan) {
    codeSearchMatches.forEach((m, idx) => {
      m.classList.toggle('current', idx === currentCodeSearchIndex);
    });

    countSpan.textContent = `${currentCodeSearchIndex + 1} / ${codeSearchMatches.length}`;
    const curr = codeSearchMatches[currentCodeSearchIndex];
    if (curr) {
      curr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  input.addEventListener('input', () => {
    currentCodeSearchIndex = -1;
    doSearch(0);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch(e.shiftKey ? -1 : 1);
    }
  });

  prevBtn.addEventListener('click', () => doSearch(-1));
  nextBtn.addEventListener('click', () => doSearch(1));

  codeContainer.tabIndex = 0;
  codeContainer.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(codeContainer);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });

  return searchBar;
}

// Render Headers Tab
function renderHeadersTab(container) {
  const e = selectedEntry;
  const reqHeaders = e.request.headers || [];
  const resHeaders = e.response.headers || [];

  container.innerHTML = `
    <div style="font-weight:700;font-size:11px;color:var(--text-muted);text-transform:uppercase;">General Information</div>
    <table class="key-value-table">
      <tr><td class="key">Source Archive</td><td class="val">${escapeHtml(e.archiveName)}</td></tr>
      <tr><td class="key">Request URL</td><td class="val">${escapeHtml(e.url)}</td></tr>
      <tr><td class="key">Request Method</td><td class="val">${e.method}</td></tr>
      <tr><td class="key">Status Code</td><td class="val">${e.status} ${escapeHtml(e.statusText)}</td></tr>
      <tr><td class="key">Remote Address</td><td class="val">${escapeHtml(e.serverIPAddress || 'N/A')}</td></tr>
      <tr><td class="key">Response Time</td><td class="val">${e.time} ms</td></tr>
      <tr><td class="key">Base Route</td><td class="val">${escapeHtml(e.basePath)}</td></tr>
    </table>

    <div style="font-weight:700;font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-top:8px;">Response Headers (${resHeaders.length})</div>
    <table class="key-value-table">
      ${resHeaders.map(h => `<tr><td class="key">${escapeHtml(h.name)}</td><td class="val">${escapeHtml(h.value)}</td></tr>`).join('')}
    </table>

    <div style="font-weight:700;font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-top:8px;">Request Headers (${reqHeaders.length})</div>
    <table class="key-value-table">
      ${reqHeaders.map(h => `<tr><td class="key">${escapeHtml(h.name)}</td><td class="val">${escapeHtml(h.value)}</td></tr>`).join('')}
    </table>
  `;
}

// Render Query Tab
function renderQueryTab(container) {
  const e = selectedEntry;
  const queryParams = e.request.queryString || [];

  if (!queryParams.length) {
    container.innerHTML = `<div class="empty-state">No query parameters on this request.</div>`;
    return;
  }

  container.innerHTML = `
    <table class="key-value-table">
      ${queryParams.map(q => `<tr><td class="key">${escapeHtml(q.name)}</td><td class="val">${escapeHtml(q.value)}</td></tr>`).join('')}
    </table>
  `;
}

// Render Payload Tab
function renderPayloadTab(container) {
  const e = selectedEntry;
  const postData = e.request.postData;

  if (!postData || !postData.text) {
    container.innerHTML = `<div class="empty-state">No payload body sent with this request.</div>`;
    return;
  }

  let text = postData.text;
  let isJson = false;
  let parsedJson = null;
  try {
    parsedJson = JSON.parse(text);
    isJson = true;
  } catch {}

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-muted);font-weight:600;">
      <span>Content-Type: ${escapeHtml(postData.mimeType || 'text/plain')}</span>
      ${isJson ? '<span style="color:var(--primary);font-size:10px;">💡 Click any JSON value to copy</span>' : ''}
    </div>
  `;

  if (isJson && parsedJson !== null) {
    const codeView = document.createElement('div');
    codeView.className = 'json-view';
    const highlightedHtml = syntaxHighlightJson(parsedJson);
    codeView.innerHTML = highlightedHtml;

    const rawJsonStr = JSON.stringify(parsedJson, null, 2);
    const searchBar = setupCodeSearch(codeView, rawJsonStr, highlightedHtml);
    container.appendChild(searchBar);
    container.appendChild(codeView);
  } else {
    const codeView = document.createElement('div');
    codeView.className = 'code-view';
    codeView.textContent = text;
    const searchBar = setupCodeSearch(codeView, text);
    container.appendChild(searchBar);
    container.appendChild(codeView);
  }
}

// Render cURL Tab
function renderCurlTab(container) {
  const curl = generateCurl(selectedEntry);
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-muted);font-weight:600;">
      <span>cURL Command</span>
      <button class="btn btn-sm" onclick="copyCurrentCurl()">Copy cURL</button>
    </div>
  `;

  const codeView = document.createElement('div');
  codeView.className = 'code-view';
  codeView.textContent = curl;
  container.appendChild(codeView);
}

function generateCurl(e) {
  let parts = [`curl -X ${e.method} "${e.url}"`];

  if (e.request.headers) {
    e.request.headers.forEach(h => {
      const name = h.name.toLowerCase();
      if (!name.startsWith(':') && name !== 'content-length') {
        parts.push(`  -H "${h.name}: ${h.value.replace(/"/g, '\\"')}"`);
      }
    });
  }

  if (e.request.postData && e.request.postData.text) {
    const raw = e.request.postData.text.replace(/"/g, '\\"');
    parts.push(`  --data-raw "${raw}"`);
  }

  return parts.join(' \\\n');
}

// JSON Flattening & Extraction Logic
function flattenJsonObject(ob, prefix = '', depth = 0, seen = new WeakSet()) {
  const result = {};
  if (!ob || typeof ob !== 'object' || depth > 8) return result;
  if (seen.has(ob)) return { [prefix || 'circular']: '[Circular]' };
  seen.add(ob);

  for (const i in ob) {
    if (!Object.prototype.hasOwnProperty.call(ob, i)) continue;
    const key = prefix ? prefix + '.' + i : i;
    if (typeof ob[i] === 'object' && ob[i] !== null && !Array.isArray(ob[i])) {
      const flat = flattenJsonObject(ob[i], key, depth + 1, seen);
      for (const f in flat) {
        result[f] = flat[f];
      }
    } else {
      result[key] = ob[i];
    }
  }
  return result;
}

function extractRecordsFromJson(jsonObj, targetPath = '.') {
  if (!jsonObj) return [];
  let root = jsonObj;

  if (targetPath && targetPath !== '.') {
    const parts = targetPath.split('.');
    for (const p of parts) {
      if (root && typeof root === 'object') {
        root = root[p];
      } else {
        root = null;
        break;
      }
    }
  }

  if (Array.isArray(root)) return root;

  if (typeof root === 'object' && root !== null) {
    for (const key of Object.keys(root)) {
      if (Array.isArray(root[key]) && root[key].length > 0) {
        return root[key];
      }
    }
    return [root];
  }

  return [];
}

// Render JSON Interactive Table Tab
function renderJsonTableTab(container) {
  const e = selectedEntry;
  let text = e.response.content?.text || '';
  if (e.response.content?.encoding === 'base64') text = atobSafe(text) || text;

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    container.innerHTML = `<div class="empty-state">Response is not valid JSON.</div>`;
    return;
  }

  const records = extractRecordsFromJson(parsed, '.');
  if (!records.length) {
    container.innerHTML = `<div class="empty-state">No array or records found in this JSON.</div>`;
    return;
  }

  initTableState(activeTableState, records);
  renderRichTable(container, activeTableState, 'activeTable');
}

function initTableState(state, records) {
  state.rawRecords = records;
  state.baseFlattenedRecords = records.map(r => (typeof r === 'object' && r !== null ? flattenJsonObject(r) : { value: r }));
  
  const colSet = new Set();
  state.baseFlattenedRecords.forEach(r => {
    Object.keys(r).forEach(k => {
      if (k !== '_mergedCount') colSet.add(k);
    });
  });
  state.allColumns = Array.from(colSet);
  state.excludedColumns = new Set();
  state.sortCol = state.allColumns[0] || null;
  state.sortAsc = true;
  state.searchQuery = '';
  state.columnWidths = {};
  state.expandedRowIndices = new Set();
  state.mergeDuplicates = false;
  state.mergedGroupsMap = new Map();

  // Smart detection for candidate key columns
  const candidateKeys = ['studentid', 'student_id', 'id', '_id', 'userid', 'user_id', 'code', 'email', 'key', 'username', 'uuid', 'sku'];
  let foundKey = '';
  for (const cand of candidateKeys) {
    const f = state.allColumns.find(c => c.toLowerCase() === cand);
    if (f) {
      foundKey = f;
      break;
    }
  }
  state.mergeKeyCol = foundKey || state.allColumns[0] || '';

  applyDuplicateMerging(state);
}

// Smart Duplicate Merging by Chosen Key Column
function applyDuplicateMerging(state) {
  if (!state.mergeDuplicates || !state.mergeKeyCol) {
    state.flattenedRecords = [...state.baseFlattenedRecords];
    state.mergedGroupsMap.clear();
    const colSet = new Set();
    state.flattenedRecords.forEach(r => Object.keys(r).forEach(k => {
      if (k !== '_mergedCount') colSet.add(k);
    }));
    state.allColumns = Array.from(colSet);
    return;
  }

  const keyCol = state.mergeKeyCol;
  const groupOrder = [];
  const groups = new Map();

  state.baseFlattenedRecords.forEach((flatRow, idx) => {
    const rawItem = state.rawRecords[idx];
    const rawVal = flatRow[keyCol];
    
    // Missing or empty values are treated as unassigned distinct records
    const keyVal = (rawVal === undefined || rawVal === null || String(rawVal).trim() === '')
      ? `__UNASSIGNED_${idx}__`
      : String(rawVal).trim();

    if (!groups.has(keyVal)) {
      groups.set(keyVal, { rawItems: [], flatItems: [], isUnassigned: keyVal.startsWith('__UNASSIGNED_') });
      groupOrder.push(keyVal);
    }
    const g = groups.get(keyVal);
    g.rawItems.push(rawItem);
    g.flatItems.push(flatRow);
  });

  const mergedFlattened = [];
  const mergedGroupsMap = new Map();
  const allColSet = new Set();

  groupOrder.forEach(keyVal => {
    const g = groups.get(keyVal);
    if (g.isUnassigned || g.flatItems.length === 1) {
      const singleRow = { ...g.flatItems[0] };
      Object.keys(singleRow).forEach(k => {
        if (k !== '_mergedCount') allColSet.add(k);
      });
      const targetIdx = mergedFlattened.length;
      mergedFlattened.push(singleRow);
      mergedGroupsMap.set(targetIdx, {
        rawItems: g.rawItems,
        mergedCount: 1,
        keyVal: g.isUnassigned ? '(Unassigned)' : keyVal
      });
    } else {
      // Multiple records sharing the chosen key: merge into 1 record while showing all columns
      const mergedRow = {};
      const colMap = new Map();

      g.flatItems.forEach(item => {
        Object.entries(item).forEach(([k, v]) => {
          if (k === '_mergedCount') return;
          if (!colMap.has(k)) colMap.set(k, []);
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            const strVal = String(v).trim();
            if (!colMap.get(k).includes(strVal)) {
              colMap.get(k).push(strVal);
            }
          }
        });
      });

      for (const [col, vals] of colMap.entries()) {
        allColSet.add(col);
        if (vals.length === 0) {
          mergedRow[col] = '';
        } else if (vals.length === 1) {
          mergedRow[col] = vals[0];
        } else {
          mergedRow[col] = vals.join(' | ');
        }
      }

      mergedRow._mergedCount = g.flatItems.length;

      const targetIdx = mergedFlattened.length;
      mergedFlattened.push(mergedRow);
      mergedGroupsMap.set(targetIdx, {
        rawItems: g.rawItems,
        mergedCount: g.flatItems.length,
        keyVal: keyVal
      });
    }
  });

  state.flattenedRecords = mergedFlattened;
  state.mergedGroupsMap = mergedGroupsMap;
  state.allColumns = Array.from(allColSet);
}

function getTableStateAndContainer(stateVarName) {
  if (stateVarName === 'activeTable') {
    return { state: activeTableState, container: document.getElementById('detailBody') };
  } else if (stateVarName === 'combinerTable') {
    return { state: combinerTableState, container: document.getElementById('combinerOutputSection') };
  } else if (stateVarName === 'selectedTable') {
    return { state: selectedTableState, container: document.getElementById('selectedTableModalBody') };
  }
  return { state: null, container: null };
}

function toggleTableMergeDuplicates(stateVarName, isEnabled) {
  const { state, container } = getTableStateAndContainer(stateVarName);
  if (!state || !container) return;

  state.mergeDuplicates = isEnabled;
  state.expandedRowIndices.clear();
  applyDuplicateMerging(state);
  renderRichTable(container, state, stateVarName);
  Native.toast(isEnabled ? `Duplicates merged by key "${state.mergeKeyCol}"` : "Showing original records");
  Native.vibrate(25);
}

function changeTableMergeKey(stateVarName, newKey) {
  const { state, container } = getTableStateAndContainer(stateVarName);
  if (!state || !container) return;

  state.mergeKeyCol = newKey;
  state.expandedRowIndices.clear();
  applyDuplicateMerging(state);
  renderRichTable(container, state, stateVarName);
  Native.toast(`Duplicates grouped by "${newKey}"`);
  Native.vibrate(25);
}

// Rich Interactive Table Component (Column Exclusion, Duplicate Merging, Sorting, Resizing, Drawer, XLSX Export)
function renderRichTable(container, state, stateVarName) {
  const visibleColumns = state.allColumns.filter(c => c !== '_mergedCount' && !state.excludedColumns.has(c));

  // Filter rows by table search query
  const queryNorm = normalizeText(state.searchQuery);
  const filteredIndices = [];
  state.flattenedRecords.forEach((row, idx) => {
    if (!queryNorm) {
      filteredIndices.push(idx);
      return;
    }
    const rowStr = normalizeText(visibleColumns.map(c => row[c] ?? '').join(' '));
    if (rowStr.includes(queryNorm)) {
      filteredIndices.push(idx);
    }
  });

  // Sort rows
  if (state.sortCol && visibleColumns.includes(state.sortCol)) {
    const col = state.sortCol;
    filteredIndices.sort((a, b) => {
      let valA = state.flattenedRecords[a][col];
      let valB = state.flattenedRecords[b][col];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return state.sortAsc ? valA - valB : valB - valA;
      }
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      return state.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }

  // Calculate duplicate merge summary
  const totalBase = state.baseFlattenedRecords?.length || state.rawRecords?.length || 0;
  const totalRows = state.flattenedRecords.length;

  container.innerHTML = `
    <!-- Duplicate Merging Bar -->
    <div class="merge-duplicates-bar">
      <div class="merge-duplicates-group">
        <label class="col-checkbox-label" style="font-weight:700; color:var(--text-main); user-select:none; cursor:pointer;">
          <input type="checkbox" id="${stateVarName}MergeDupCheck" ${state.mergeDuplicates ? 'checked' : ''} onchange="toggleTableMergeDuplicates('${stateVarName}', this.checked)" />
          <span>🔀 Merge Duplicates</span>
        </label>
        
        ${state.mergeDuplicates ? `
          <div style="display:flex; align-items:center; gap:4px; margin-left:6px;">
            <span style="color:var(--text-muted); font-size:11px;">Key Column:</span>
            <select class="merge-key-select" id="${stateVarName}MergeKeySelect" onchange="changeTableMergeKey('${stateVarName}', this.value)">
              ${state.allColumns.filter(c => c !== '_mergedCount').map(col => `
                <option value="${escapeHtml(col)}" ${state.mergeKeyCol === col ? 'selected' : ''}>${escapeHtml(col)}</option>
              `).join('')}
            </select>
          </div>
        ` : ''}
      </div>

      <div style="display:flex; align-items:center; gap:6px;">
        ${state.mergeDuplicates ? `
          <span class="merge-badge">
            ${totalRows} unique row(s) (from ${totalBase} records)
          </span>
        ` : `
          <span style="font-size:10px; color:var(--text-dim);">
            Merge rows sharing the same key (e.g. studentid, id, email)
          </span>
        `}
      </div>
    </div>

    <!-- Table Toolbar -->
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
      <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:180px;">
        <input type="search" class="search-input" id="${stateVarName}SearchInput" placeholder="Filter rows (${filteredIndices.length}/${state.flattenedRecords.length})..." value="${escapeHtml(state.searchQuery)}" />
      </div>

      <div style="display:flex;align-items:center;gap:6px;position:relative;">
        <!-- Column Exclusion Selector Button -->
        <button class="btn btn-sm" id="${stateVarName}ColBtn" onclick="toggleColumnSelector('${stateVarName}')">
          Columns (${visibleColumns.length}/${state.allColumns.filter(c => c !== '_mergedCount').length}) ▾
        </button>

        <div id="${stateVarName}ColMenu" class="col-selector-menu" style="display:none;">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:4px;margin-bottom:4px;">
            <button class="btn btn-sm" onclick="setAllColumnsExcluded('${stateVarName}', false)">All</button>
            <button class="btn btn-sm" onclick="setAllColumnsExcluded('${stateVarName}', true)">None</button>
          </div>
          ${state.allColumns.filter(c => c !== '_mergedCount').map(col => `
            <label class="col-checkbox-label">
              <input type="checkbox" ${state.excludedColumns.has(col) ? '' : 'checked'} onchange="toggleColumnExclusion('${stateVarName}', '${escapeHtml(col)}', this.checked)" />
              <span>${escapeHtml(col)}</span>
            </label>
          `).join('')}
        </div>

        <!-- Export XLSX Button -->
        <button class="btn btn-sm btn-primary" onclick="exportTableToXlsx('${stateVarName}')" title="Export as native Excel XLSX file">
          Export XLSX
        </button>
        <button class="btn btn-sm" onclick="exportTableToCsv('${stateVarName}')" title="Export as CSV">
          CSV
        </button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="table-wrap" id="${stateVarName}Wrap">
      <table class="records-table" id="${stateVarName}Table">
        <thead>
          <tr>
            <th style="width:42px;text-align:center;">#</th>
            ${visibleColumns.map(col => {
              let sortClass = '';
              if (state.sortCol === col) sortClass = state.sortAsc ? 'sort-asc' : 'sort-desc';
              const width = state.columnWidths[col] ? `width:${state.columnWidths[col]}px;` : '';
              return `
                <th class="${sortClass}" style="${width}" onclick="handleTableSort('${stateVarName}', '${escapeHtml(col)}')">
                  ${escapeHtml(col)}
                  <span class="th-resizer" onclick="event.stopPropagation()" onmousedown="initColResize(event, '${stateVarName}', '${escapeHtml(col)}')"></span>
                </th>
              `;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${filteredIndices.map((origIdx, displayIdx) => {
            const row = state.flattenedRecords[origIdx];
            const isExpanded = state.expandedRowIndices.has(origIdx);
            const mergedInfo = state.mergedGroupsMap?.get(origIdx);
            const isMergedRow = Boolean(row._mergedCount && row._mergedCount > 1);

            return `
              <tr onclick="toggleTableRowDrawer('${stateVarName}', ${origIdx})">
                <td style="text-align:center;color:var(--text-dim);white-space:nowrap;">
                  ${displayIdx + 1}
                  ${isMergedRow ? `<span class="badge badge-primary" style="font-size:8px;padding:0 3px;margin-left:2px;" title="Merged from ${row._mergedCount} records">${row._mergedCount}x</span>` : ''}
                </td>
                ${visibleColumns.map(col => {
                  let val = row[col];
                  if (val === undefined || val === null) val = '';
                  else if (typeof val === 'object') val = JSON.stringify(val);
                  return `<td title="${escapeHtml(String(val))}">${escapeHtml(String(val))}</td>`;
                }).join('')}
              </tr>
              ${isExpanded ? `
                <tr class="drawer-row">
                  <td colspan="${visibleColumns.length + 1}">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:4px;">
                      <span style="font-weight:700;font-size:11px;color:var(--text-muted);">
                        ${mergedInfo && mergedInfo.mergedCount > 1
                          ? `Merged Record #${origIdx + 1} (${mergedInfo.mergedCount} records merged by ${escapeHtml(state.mergeKeyCol)} = "${escapeHtml(mergedInfo.keyVal)}")`
                          : `Record Object #${origIdx + 1}`}
                      </span>
                      <span style="font-size:10px;color:var(--text-dim);">💡 Click any JSON value to copy</span>
                    </div>
                    <div class="json-view" style="max-height:280px;">${syntaxHighlightJson(mergedInfo && mergedInfo.rawItems.length === 1 ? mergedInfo.rawItems[0] : (mergedInfo?.rawItems || state.rawRecords[origIdx]))}</div>
                  </td>
                </tr>
              ` : ''}
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Live table search handler
  const searchInput = container.querySelector(`#${stateVarName}SearchInput`);
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderRichTable(container, state, stateVarName);
    const updatedInput = container.querySelector(`#${stateVarName}SearchInput`);
    if (updatedInput) {
      updatedInput.focus();
      updatedInput.setSelectionRange(state.searchQuery.length, state.searchQuery.length);
    }
  });
}

function toggleColumnSelector(stateVarName) {
  const menu = document.getElementById(`${stateVarName}ColMenu`);
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
}

function toggleColumnExclusion(stateVarName, col, isIncluded) {
  const { state, container } = getTableStateAndContainer(stateVarName);
  if (!state || !container) return;

  if (isIncluded) {
    state.excludedColumns.delete(col);
  } else {
    state.excludedColumns.add(col);
  }

  renderRichTable(container, state, stateVarName);
  const menu = document.getElementById(`${stateVarName}ColMenu`);
  if (menu) menu.style.display = 'flex';
}

function setAllColumnsExcluded(stateVarName, excludeAll) {
  const { state, container } = getTableStateAndContainer(stateVarName);
  if (!state || !container) return;

  if (excludeAll) {
    state.allColumns.forEach(c => state.excludedColumns.add(c));
  } else {
    state.excludedColumns.clear();
  }

  renderRichTable(container, state, stateVarName);
  const menu = document.getElementById(`${stateVarName}ColMenu`);
  if (menu) menu.style.display = 'flex';
}

function handleTableSort(stateVarName, col) {
  const { state, container } = getTableStateAndContainer(stateVarName);
  if (!state || !container) return;

  if (state.sortCol === col) {
    state.sortAsc = !state.sortAsc;
  } else {
    state.sortCol = col;
    state.sortAsc = true;
  }

  renderRichTable(container, state, stateVarName);
}

function toggleTableRowDrawer(stateVarName, origIdx) {
  const { state, container } = getTableStateAndContainer(stateVarName);
  if (!state || !container) return;

  if (state.expandedRowIndices.has(origIdx)) {
    state.expandedRowIndices.delete(origIdx);
  } else {
    state.expandedRowIndices.add(origIdx);
  }

  renderRichTable(container, state, stateVarName);
}

function initColResize(e, stateVarName, col) {
  e.preventDefault();
  e.stopPropagation();

  const { state } = getTableStateAndContainer(stateVarName);
  if (!state) return;
  const th = e.target.parentElement;
  const startX = e.pageX;
  const startWidth = th.offsetWidth;

  function onMouseMove(moveEvent) {
    const newWidth = Math.max(50, startWidth + (moveEvent.pageX - startX));
    state.columnWidths[col] = newWidth;
    th.style.width = newWidth + 'px';
  }

  function onMouseUp() {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

// Client-Side Zero-Dependency XLSX Exporter (SpreadsheetML Standard)
function exportTableToXlsx(stateVarName) {
  const { state } = getTableStateAndContainer(stateVarName);
  if (!state || !state.flattenedRecords.length) {
    Native.toast("No records to export");
    return;
  }

  const visibleColumns = state.allColumns.filter(c => c !== '_mergedCount' && !state.excludedColumns.has(c));
  if (!visibleColumns.length) {
    Native.toast("No columns selected for export");
    return;
  }

  const queryNorm = normalizeText(state.searchQuery);
  const rowsToExport = state.flattenedRecords.filter(row => {
    if (!queryNorm) return true;
    const rowStr = normalizeText(visibleColumns.map(c => row[c] ?? '').join(' '));
    return rowStr.includes(queryNorm);
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<?mso-application progid="Excel.Sheet"?>\n`;
  xml += `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n`;
  xml += ` xmlns:o="urn:schemas-microsoft-com:office:office"\n`;
  xml += ` xmlns:x="urn:schemas-microsoft-com:office:excel"\n`;
  xml += ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n`;
  xml += ` xmlns:html="http://www.w3.org/TR/REC-html40">\n`;
  xml += ` <Styles>\n`;
  xml += `  <Style ss:ID="Header">\n`;
  xml += `   <Font ss:Bold="1" ss:Color="#FFFFFF"/>\n`;
  xml += `   <Interior ss:Color="#161A23" ss:Pattern="Solid"/>\n`;
  xml += `   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n`;
  xml += `  </Style>\n`;
  xml += `  <Style ss:ID="Default">\n`;
  xml += `   <Alignment ss:Vertical="Center"/>\n`;
  xml += `  </Style>\n`;
  xml += ` </Styles>\n`;
  xml += ` <Worksheet ss:Name="Records">\n`;
  xml += `  <Table>\n`;

  // Header row
  xml += `   <Row ss:StyleID="Header">\n`;
  visibleColumns.forEach(col => {
    xml += `    <Cell><Data ss:Type="String">${escapeXml(col)}</Data></Cell>\n`;
  });
  xml += `   </Row>\n`;

  // Data rows
  rowsToExport.forEach(row => {
    xml += `   <Row>\n`;
    visibleColumns.forEach(col => {
      let val = row[col];
      if (val === undefined || val === null) {
        xml += `    <Cell><Data ss:Type="String"></Data></Cell>\n`;
      } else if (typeof val === 'number') {
        xml += `    <Cell><Data ss:Type="Number">${val}</Data></Cell>\n`;
      } else if (typeof val === 'boolean') {
        xml += `    <Cell><Data ss:Type="String">${val ? 'TRUE' : 'FALSE'}</Data></Cell>\n`;
      } else {
        xml += `    <Cell><Data ss:Type="String">${escapeXml(String(val))}</Data></Cell>\n`;
      }
    });
    xml += `   </Row>\n`;
  });

  xml += `  </Table>\n`;
  xml += ` </Worksheet>\n`;
  xml += `</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
  const filename = `har_table_${Date.now()}.xlsx`;
  downloadBlob(blob, filename);
  Native.toast(`Exported ${rowsToExport.length} rows to ${filename}`);
  Native.vibrate(35);
}

function exportTableToCsv(stateVarName) {
  const { state } = getTableStateAndContainer(stateVarName);
  if (!state || !state.flattenedRecords.length) {
    Native.toast("No records to export");
    return;
  }

  const visibleColumns = state.allColumns.filter(c => c !== '_mergedCount' && !state.excludedColumns.has(c));
  if (!visibleColumns.length) return;

  const queryNorm = normalizeText(state.searchQuery);
  const rowsToExport = state.flattenedRecords.filter(row => {
    if (!queryNorm) return true;
    const rowStr = normalizeText(visibleColumns.map(c => row[c] ?? '').join(' '));
    return rowStr.includes(queryNorm);
  });

  const lines = [];
  lines.push(visibleColumns.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));

  rowsToExport.forEach(row => {
    const fields = visibleColumns.map(col => {
      const val = row[col] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    lines.push(fields.join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `har_table_${Date.now()}.csv`;
  downloadBlob(blob, filename);
  Native.toast(`Exported CSV: ${filename}`);
  Native.vibrate(30);
}

// Merge Selected Traffic Calls into Master Table
function openSelectedTrafficTableModal() {
  const selectedEntries = harEntries.filter(e => selectedRequestIds.has(e.id) && !deletedIds.has(e.id));
  if (!selectedEntries.length) {
    Native.toast("Please select at least one traffic call");
    return;
  }

  let allExtractedRecords = [];
  selectedEntries.forEach(req => {
    let text = req.response.content?.text || '';
    if (req.response.content?.encoding === 'base64') text = atobSafe(text) || text;
    
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {}
    }

    if (parsed) {
      const records = extractRecordsFromJson(parsed, '.');
      if (records.length > 0) {
        records.forEach(r => {
          if (r && typeof r === 'object') {
            const copy = { ...r };
            if (copy._sourcePath === undefined && selectedEntries.length > 1) {
              copy._sourcePath = req.pathname || req.url;
            }
            allExtractedRecords.push(copy);
          } else {
            allExtractedRecords.push({ value: r, _sourcePath: req.pathname || req.url });
          }
        });
      } else if (typeof parsed === 'object') {
        const copy = { ...parsed };
        if (copy._sourcePath === undefined && selectedEntries.length > 1) {
          copy._sourcePath = req.pathname || req.url;
        }
        allExtractedRecords.push(copy);
      }
    } else {
      allExtractedRecords.push({
        _sourcePath: req.pathname || req.url,
        method: req.method,
        status: req.status,
        host: req.host,
        mime: req.mime || req.response?.content?.mimeType || '',
        size: req.size,
        timeMs: req.time
      });
    }
  });

  if (!allExtractedRecords.length) {
    Native.toast("No records could be extracted from selected calls");
    return;
  }

  selectedTableState = {
    rawRecords: [],
    baseFlattenedRecords: [],
    flattenedRecords: [],
    allColumns: [],
    excludedColumns: new Set(),
    sortCol: null,
    sortAsc: true,
    searchQuery: '',
    columnWidths: {},
    expandedRowIndices: new Set(),
    mergeDuplicates: false,
    mergeKeyCol: '',
    mergedGroupsMap: new Map()
  };

  initTableState(selectedTableState, allExtractedRecords);

  const titleEl = document.getElementById('selectedTableModalTitle');
  if (titleEl) {
    titleEl.textContent = `Selected Traffics Table (${selectedEntries.length} calls • ${allExtractedRecords.length} records)`;
  }

  const container = document.getElementById('selectedTableModalBody');
  renderRichTable(container, selectedTableState, 'selectedTable');

  document.getElementById('selectedTableModal').classList.add('active');
  Native.vibrate(30);
}

function closeSelectedTableModal() {
  const modal = document.getElementById('selectedTableModal');
  if (modal) modal.classList.remove('active');
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadBlob(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  } catch (err) {
    Native.toast("Download error: " + err.message);
  }
}

// Prepared Path Tables & Combiner Logic
function getPreparedPathGroups() {
  const jsonRequests = harEntries.filter(e => {
    if (deletedIds.has(e.id)) return false;
    return e.type === 'json' || (e.mime && e.mime.includes('json'));
  });

  const groupMap = new Map();
  jsonRequests.forEach(e => {
    const path = e.rawPathname || '/';
    if (!groupMap.has(path)) {
      groupMap.set(path, []);
    }
    groupMap.get(path).push(e);
  });

  const list = [];
  for (const [path, reqs] of groupMap.entries()) {
    const methods = Array.from(new Set(reqs.map(r => r.method)));
    const hosts = Array.from(new Set(reqs.map(r => r.host)));
    
    let totalRecords = 0;
    reqs.forEach(r => {
      let text = r.response.content?.text || '';
      if (r.response.content?.encoding === 'base64') text = atobSafe(text) || text;
      try {
        const parsed = JSON.parse(text);
        const extracted = extractRecordsFromJson(parsed, '.');
        totalRecords += extracted.length;
      } catch {}
    });

    list.push({
      pathname: path,
      requests: reqs,
      methods: methods,
      hosts: hosts,
      totalRecords: totalRecords
    });
  }

  list.sort((a, b) => b.requests.length - a.requests.length || a.pathname.localeCompare(b.pathname));
  return list;
}

function updatePreparedPathsBadge() {
  const badge = document.getElementById('preparedPathsCountBadge');
  if (!badge) return;
  const groups = getPreparedPathGroups();
  badge.textContent = groups.length;
}

function switchCombinerTab(tab) {
  activeCombinerTab = tab;
  document.getElementById('combinerTabPreparedBtn').classList.toggle('active', tab === 'prepared');
  document.getElementById('combinerTabCustomBtn').classList.toggle('active', tab === 'custom');

  const prepSection = document.getElementById('preparedPathsSection');
  const customSection = document.getElementById('customCombinerSection');

  if (tab === 'prepared') {
    prepSection.style.display = 'flex';
    customSection.style.display = 'none';
    renderPreparedPathsList();
  } else {
    prepSection.style.display = 'none';
    customSection.style.display = 'flex';
    renderCustomCombinerList();
  }
}

// Multi-Path Selection State for Prepared Path Tables
let selectedPreparedPaths = new Set();

function toggleSelectPreparedPath(pathname, isSelected) {
  if (isSelected) {
    selectedPreparedPaths.add(pathname);
  } else {
    selectedPreparedPaths.delete(pathname);
  }
  updatePreparedPathsSelectionUI();
  Native.vibrate(15);
}

function selectAllPreparedPaths(select) {
  let groups = getPreparedPathGroups();
  const searchInput = document.getElementById('preparedPathSearch');
  const query = searchInput ? normalizeText(searchInput.value) : '';

  if (query) {
    groups = groups.filter(g => normalizeText(g.pathname).includes(query) || g.hosts.some(h => normalizeText(h).includes(query)));
  }

  groups.forEach(g => {
    if (select) {
      selectedPreparedPaths.add(g.pathname);
    } else {
      selectedPreparedPaths.delete(g.pathname);
    }
  });

  document.querySelectorAll('.prep-path-checkbox').forEach(cb => {
    const p = cb.dataset.path;
    if (p) cb.checked = selectedPreparedPaths.has(p);
  });

  document.querySelectorAll('.prepared-path-card').forEach(card => {
    const cb = card.querySelector('.prep-path-checkbox');
    if (cb) card.classList.toggle('selected', cb.checked);
  });

  updatePreparedPathsSelectionUI();
  Native.toast(select ? `Selected ${groups.length} paths` : 'Cleared path selection');
  Native.vibrate(20);
}

function updatePreparedPathsSelectionUI() {
  const badge = document.getElementById('selectedPreparedPathsCountBadge');
  const btn = document.getElementById('combineSelectedPathsBtn');
  const count = selectedPreparedPaths.size;

  if (count > 0) {
    if (badge) {
      badge.style.display = 'inline-flex';
      badge.textContent = `${count} ${count === 1 ? 'path' : 'paths'} selected`;
    }
    if (btn) {
      btn.style.display = 'inline-flex';
      btn.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:13px;height:13px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
        Combine Selected Paths (${count})
      `;
    }
  } else {
    if (badge) badge.style.display = 'none';
    if (btn) btn.style.display = 'none';
  }
}

function combineSelectedPreparedPaths() {
  if (!selectedPreparedPaths.size) {
    Native.toast("Please select at least one path to combine");
    return;
  }

  const chosenPaths = Array.from(selectedPreparedPaths);
  const reqs = harEntries.filter(e => {
    if (deletedIds.has(e.id)) return false;
    return selectedPreparedPaths.has(e.rawPathname) && (e.type === 'json' || (e.mime && e.mime.includes('json')));
  });

  if (!reqs.length) {
    Native.toast("No active JSON requests found for the selected paths");
    return;
  }

  let masterRecords = [];
  reqs.forEach(req => {
    let text = req.response.content?.text || '';
    if (req.response.content?.encoding === 'base64') text = atobSafe(text) || text;
    try {
      const parsed = JSON.parse(text);
      const extracted = extractRecordsFromJson(parsed, '.');
      extracted.forEach(record => {
        if (record && typeof record === 'object') {
          const copy = { ...record };
          if (copy._sourcePath === undefined && chosenPaths.length > 1) {
            copy._sourcePath = req.pathname || req.url;
          }
          masterRecords.push(copy);
        } else {
          masterRecords.push({ value: record, _sourcePath: req.pathname || req.url });
        }
      });
    } catch {}
  });

  if (!masterRecords.length) {
    Native.toast("No records could be extracted from the selected paths");
    return;
  }

  combinerTableState = {
    rawRecords: [],
    baseFlattenedRecords: [],
    flattenedRecords: [],
    allColumns: [],
    excludedColumns: new Set(),
    sortCol: null,
    sortAsc: true,
    searchQuery: '',
    columnWidths: {},
    expandedRowIndices: new Set(),
    mergeDuplicates: false,
    mergeKeyCol: '',
    mergedGroupsMap: new Map()
  };

  initTableState(combinerTableState, masterRecords);

  const outputSection = document.getElementById('combinerOutputSection');
  outputSection.style.display = 'flex';
  renderRichTable(outputSection, combinerTableState, 'combinerTable');

  outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  Native.toast(`Combined ${masterRecords.length} records from ${chosenPaths.length} paths!`);
  Native.vibrate(35);
}

function renderPreparedPathsList() {
  const container = document.getElementById('preparedPathsList');
  if (!container) return;

  let groups = getPreparedPathGroups();
  const searchInput = document.getElementById('preparedPathSearch');
  const query = searchInput ? normalizeText(searchInput.value) : '';

  if (query) {
    groups = groups.filter(g => normalizeText(g.pathname).includes(query) || g.hosts.some(h => normalizeText(h).includes(query)));
  }

  if (!groups.length) {
    container.innerHTML = `<div class="empty-state">${query ? `No prepared paths matching "${escapeHtml(query)}"` : 'No JSON endpoints detected in currently active archives.'}</div>`;
    updatePreparedPathsSelectionUI();
    return;
  }

  container.innerHTML = groups.map(g => {
    const isSelected = selectedPreparedPaths.has(g.pathname);
    return `
      <div class="prepared-path-card ${isSelected ? 'selected' : ''}">
        <div class="req-check-wrap" onclick="event.stopPropagation()" title="Select this path to combine">
          <input type="checkbox" class="req-select-checkbox prep-path-checkbox" data-path="${escapeHtmlAttr(g.pathname)}" ${isSelected ? 'checked' : ''} onchange="toggleSelectPreparedPath('${escapeHtmlAttr(g.pathname)}', this.checked)" />
        </div>
        <div class="prepared-path-info">
          <div style="display:flex;align-items:center;gap:6px;min-width:0;">
            ${g.methods.map(m => `<span class="method-tag method-${m}" style="font-size:8.5px;padding:1px 3px;">${m}</span>`).join('')}
            <span class="prepared-path-name" title="${escapeHtml(g.pathname)}">${escapeHtml(g.pathname)}</span>
          </div>
          <div class="prepared-path-meta">
            <span class="badge badge-primary">${g.requests.length} ${g.requests.length > 1 ? 'calls combined' : 'call'}</span>
            ${g.totalRecords > 0 ? `<span class="badge" style="background:var(--success-light);color:var(--success);">${g.totalRecords} records</span>` : ''}
            <span style="color:var(--text-dim);">host: ${escapeHtml(g.hosts.join(', '))}</span>
          </div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="openPreparedPathTable('${escapeHtmlAttr(g.pathname)}')">
          Open Table
        </button>
      </div>
    `;
  }).join('');

  updatePreparedPathsSelectionUI();
}

function openPreparedPathTable(pathname) {
  const reqs = harEntries.filter(e => {
    if (deletedIds.has(e.id)) return false;
    return e.rawPathname === pathname && (e.type === 'json' || (e.mime && e.mime.includes('json')));
  });

  if (!reqs.length) {
    Native.toast("No active requests found for path: " + pathname);
    return;
  }

  let masterRecords = [];
  reqs.forEach(req => {
    let text = req.response.content?.text || '';
    if (req.response.content?.encoding === 'base64') text = atobSafe(text) || text;
    try {
      const parsed = JSON.parse(text);
      const extracted = extractRecordsFromJson(parsed, '.');
      extracted.forEach(record => {
        masterRecords.push(record);
      });
    } catch {}
  });

  if (!masterRecords.length) {
    Native.toast("No records could be extracted from: " + pathname);
    return;
  }

  combinerTableState = {
    rawRecords: [],
    baseFlattenedRecords: [],
    flattenedRecords: [],
    allColumns: [],
    excludedColumns: new Set(),
    sortCol: null,
    sortAsc: true,
    searchQuery: '',
    columnWidths: {},
    expandedRowIndices: new Set(),
    mergeDuplicates: false,
    mergeKeyCol: '',
    mergedGroupsMap: new Map()
  };

  initTableState(combinerTableState, masterRecords);

  const outputSection = document.getElementById('combinerOutputSection');
  outputSection.style.display = 'flex';
  renderRichTable(outputSection, combinerTableState, 'combinerTable');

  outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  Native.toast(`Loaded ${masterRecords.length} records for ${pathname}`);
  Native.vibrate(35);
}

function renderCustomCombinerList() {
  const jsonRequests = harEntries.filter(e => {
    if (deletedIds.has(e.id)) return false;
    return e.type === 'json' || (e.mime && e.mime.includes('json'));
  });

  const selector = document.getElementById('combinerReqSelector');
  if (!jsonRequests.length) {
    selector.innerHTML = `<div class="empty-state">No JSON requests detected in this archive.</div>`;
  } else {
    selector.innerHTML = jsonRequests.map(e => `
      <label class="col-checkbox-label">
        <input type="checkbox" class="combiner-req-check" value="${e.id}" checked />
        <span class="method-tag method-${e.method}" style="font-size:8.5px;padding:1px 3px;">${e.method}</span>
        <span style="font-weight:600;font-size:11px;">${escapeHtml(e.pathname)}</span>
        <span style="color:var(--text-dim);font-size:10px;">(${escapeHtml(e.host)})</span>
      </label>
    `).join('');
  }
}

function openCombinerModal() {
  switchCombinerTab('prepared');
  document.getElementById('combinerOutputSection').style.display = 'none';
  document.getElementById('combinerModal').classList.add('active');
  Native.vibrate(25);
}

function closeCombinerModal() {
  document.getElementById('combinerModal').classList.remove('active');
}

function selectAllCombinerReqs(checked) {
  document.querySelectorAll('.combiner-req-check').forEach(c => c.checked = checked);
}

function executeCombineRequests() {
  const checkedBoxes = Array.from(document.querySelectorAll('.combiner-req-check:checked'));
  if (!checkedBoxes.length) {
    Native.toast("Please select at least one request to combine");
    return;
  }

  const selectedIds = checkedBoxes.map(b => b.value);
  const targetPath = document.getElementById('combinerJsonPath').value.trim() || '.';
  const dedupKey = document.getElementById('combinerDedupKey').value.trim();

  let masterRecords = [];
  const seenKeys = new Set();

  selectedIds.forEach(id => {
    const req = harEntries.find(e => e.id === id);
    if (!req) return;
    let text = req.response.content?.text || '';
    if (req.response.content?.encoding === 'base64') text = atobSafe(text) || text;
    try {
      const parsed = JSON.parse(text);
      const extracted = extractRecordsFromJson(parsed, targetPath);
      extracted.forEach(record => {
        if (dedupKey && typeof record === 'object' && record !== null && record[dedupKey] !== undefined) {
          const keyVal = String(record[dedupKey]);
          if (seenKeys.has(keyVal)) return;
          seenKeys.add(keyVal);
        }
        masterRecords.push(record);
      });
    } catch {}
  });

  if (!masterRecords.length) {
    Native.toast("No records found at path: " + targetPath);
    return;
  }

  combinerTableState = {
    rawRecords: [],
    baseFlattenedRecords: [],
    flattenedRecords: [],
    allColumns: [],
    excludedColumns: new Set(),
    sortCol: null,
    sortAsc: true,
    searchQuery: '',
    columnWidths: {},
    expandedRowIndices: new Set(),
    mergeDuplicates: false,
    mergeKeyCol: '',
    mergedGroupsMap: new Map()
  };

  initTableState(combinerTableState, masterRecords);

  const outputSection = document.getElementById('combinerOutputSection');
  outputSection.style.display = 'flex';
  renderRichTable(outputSection, combinerTableState, 'combinerTable');

  outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  Native.toast(`Combined ${masterRecords.length} records into Master Table`);
  Native.vibrate(35);
}

// Detail Modal Actions
function copyCurrentUrl() {
  if (selectedEntry) Native.copy(selectedEntry.url);
}

function copyCurrentCurl() {
  if (selectedEntry) Native.copy(generateCurl(selectedEntry));
}

function copyCurrentResponse() {
  if (selectedEntry?.response?.content?.text) {
    let text = selectedEntry.response.content.text;
    if (selectedEntry.response.content.encoding === 'base64') text = atobSafe(text) || text;
    Native.copy(text);
  } else {
    Native.toast("No response content");
  }
}

function downloadCurrentResponse() {
  if (!selectedEntry?.response?.content) {
    Native.toast("No file content to download");
    return;
  }
  const content = selectedEntry.response.content;
  const mime = content.mimeType || 'application/octet-stream';
  let blob;

  if (content.encoding === 'base64') {
    try {
      const cleanBase64 = (content.text || '').replace(/\s/g, '');
      const binaryString = atob(cleanBase64);
      const byteNums = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteNums[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([byteNums], { type: mime });
    } catch {
      blob = new Blob([content.text || ''], { type: mime });
    }
  } else {
    blob = new Blob([content.text || ''], { type: mime });
  }

  let ext = 'bin';
  if (mime.includes('json')) ext = 'json';
  else if (mime.includes('html')) ext = 'html';
  else if (mime.includes('javascript')) ext = 'js';
  else if (mime.includes('css')) ext = 'css';
  else if (mime.includes('png')) ext = 'png';
  else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
  else if (mime.includes('pdf')) ext = 'pdf';
  else if (mime.includes('csv')) ext = 'csv';
  else if (mime.includes('xlsx')) ext = 'xlsx';
  else if (mime.includes('svg')) ext = 'svg';

  // Extract filename from URL pathname if present
  let filename = `response_${selectedEntry.id}.${ext}`;
  try {
    const parts = selectedEntry.rawPathname.split('/').filter(Boolean);
    if (parts.length > 0 && parts[parts.length - 1].includes('.')) {
      filename = parts[parts.length - 1];
    }
  } catch {}

  downloadBlob(blob, filename);
  Native.toast(`Download started: ${filename}`);
  Native.vibrate(30);
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
