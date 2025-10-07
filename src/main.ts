import { bangs } from "./bang";
import "./global.css";

function renderMainPage() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  app.innerHTML = `
    <div class="main-bg">
      <button id="settings-link" class="settings-button-top" title="Settings">
        <img src="/settings.svg" alt="Settings" />
      </button>
      <div class="search-container">
        <div class="search-header">
          <img src="/search.svg" alt="Unduck logo" class="logo" />
          <div class="title-section">
            <h1 class="title">Und*ck</h1>
            <p class="tagline">Search with bangs!</p>
          </div>
        </div>
        <div class="search-box-container">
          <div class="input-group search-input-group">
            <span class="input-icon"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input id="main-search" type="text" placeholder="Search the web (try !g for Google, !yt for YouTube, etc.)" class="search-input with-icon" autofocus />
          </div>
        </div>
      </div>
      <div class="toast" id="toast" style="display:none"></div>
      <footer class="footer">
        <span>Made by <a href="https://github.com/t3dotgg/unduck" target="_blank">t3dotgg</a> and modified by <a href="https://github.com/thomasnowproductions/unduck" target="_blank">ThomasNow Productions</a></span>
      </footer>
    </div>
  `;

  const searchInput = app.querySelector<HTMLInputElement>("#main-search")!;
  const settingsLink = app.querySelector<HTMLButtonElement>("#settings-link")!;
  const toast = app.querySelector<HTMLDivElement>("#toast")!;

  function performSearch() {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `/?q=${encodeURIComponent(query)}`;
    }
  }

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });

  settingsLink.addEventListener("click", () => {
    renderSettingsPage();
  });
}

function renderSettingsPage() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  // Use all bangs, sorted alphabetically by their display name
  const allBangs = bangs
    .map(b => ({ t: b.t, s: b.s }))
    .sort((a, b) => a.s.localeCompare(b.s));

  app.innerHTML = `
    <div class="settings-bg">
      <div class="settings-container">
        <header class="settings-header">
          <button id="back-to-search" class="back-button">← Back to Search</button>
          <div class="settings-title">
            <img src="/search.svg" alt="Unduck logo" class="settings-logo" />
            <div>
              <h1 class="settings-title-text">Settings</h1>
              <p class="settings-subtitle">Configure your search preferences</p>
            </div>
          </div>
        </header>
        <div class="settings-content">
          <section class="settings-section">
            <h2 class="settings-section-title">Search Engine Setup</h2>
            <p class="settings-description">Add this URL as a custom search engine in your browser to enable fast bang searches.</p>

            <div class="form-group">
              <label class="form-label">Default Bang</label>
              <input
                type="text"
                id="default-bang-input"
                class="bang-input"
                placeholder="e.g., g for Google, yt for YouTube, w for Wikipedia"
                value=""
              />
              <small class="input-help">Enter the bang shortcut (without the ! symbol)</small>
            </div>

            <div class="form-group">
              <label class="form-label">Browser Search URL</label>
              <div class="url-display-container">
                <input
                  type="text"
                  class="url-display-input"
                  id="output-url"
                  value="https://unduck-me.vercel.app/?q=%s"
                  readonly
                />
                <button class="copy-button" title="Copy URL">
                  <img src="/clipboard.svg" alt="Copy" />
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
      <div class="toast" id="toast" style="display:none"></div>
    </div>
  `;

  const backButton = app.querySelector<HTMLButtonElement>("#back-to-search")!;
  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>("#output-url")!;
  const defaultBangInput = app.querySelector<HTMLInputElement>("#default-bang-input")!;
  const toast = app.querySelector<HTMLDivElement>("#toast")!;

  function updateUrlInput() {
    const bangValue = defaultBangInput.value.trim().toLowerCase();
    let url = "https://unduck-me.vercel.app/?q=%s";
    if (bangValue && bangValue !== "g") {
      url += `&defaultBang=${bangValue}`;
    }
    urlInput.value = url;
  }

  defaultBangInput.addEventListener("input", updateUrlInput);

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";
    toast.textContent = "Copied!";
    toast.style.display = "block";
    toast.classList.add("show");
    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
      toast.classList.remove("show");
      toast.style.display = "none";
    }, 2000);
  });

  backButton.addEventListener("click", () => {
    renderMainPage();
  });
}

function noSearchDefaultPageRender() {

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>("#output-url")!;
  const bangPicker = app.querySelector<HTMLSelectElement>("#bang-picker")!;
  const bangSearch = app.querySelector<HTMLInputElement>("#bang-search")!;
  const toast = app.querySelector<HTMLDivElement>("#toast")!;

  function updateUrlInput() {
    const selected = bangPicker.value;
    let url = "https://unduck-me.vercel.app/?q=%s";
    if (selected && selected !== "g") {
      url += `&defaultBang=${selected}`;
    }
    urlInput.value = url;
  }

  bangPicker.addEventListener("change", updateUrlInput);

  bangSearch.addEventListener("input", () => {
    const search = bangSearch.value.trim().toLowerCase();
    // Allow searching by bang with or without '!'
    const normalizedSearch = search.startsWith("!") ? search.slice(1) : search;

    // Find exact match first
    const exactMatch = allBangs.filter(b => b.t.toLowerCase() === normalizedSearch);
    // Then find partial matches, excluding the exact match
    const partialMatches = allBangs.filter(b =>
      (search === "" ||
        b.s.toLowerCase().includes(search) ||
        b.t.toLowerCase().includes(normalizedSearch)) &&
      b.t.toLowerCase() !== normalizedSearch
    );
    const filteredBangs = [...exactMatch, ...partialMatches];

    let optionsHtml = `<option value="">Google (!g, default)</option>`;
    if (filteredBangs.length > 0) {
      optionsHtml += filteredBangs
        .map(b => `<option value="${b.t}">${b.s} (!${b.t})</option>`)
        .join("");
    } else {
      // Styled 'No bangs found' option
      optionsHtml += `<option value="" disabled style="color: #888; font-style: italic; background: #f8d7da; color: #721c24;">No bangs found</option>`;
    }
    bangPicker.innerHTML = optionsHtml;
    bangPicker.selectedIndex = 0;
    updateUrlInput();
  });

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";
    toast.textContent = "Copied!";
    toast.style.display = "block";
    toast.classList.add("show");
    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
      toast.classList.remove("show");
      toast.style.display = "none";
    }, 2000);
  });
}

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();

  // Get defaultBang from URL param if present
  const urlDefaultBang = url.searchParams.get("defaultBang")?.toLowerCase();
  const urlDefaultBangObj = urlDefaultBang ? bangs.find((b) => b.t === urlDefaultBang) : undefined;

  // Get defaultBang from localStorage or fallback to 'g'
  const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
  const localStorageDefaultBangObj = bangs.find((b) => b.t === LS_DEFAULT_BANG);

  // Precedence: explicit bang > url param > localStorage > 'g'
  const selectedBang =
    bangs.find((b) => b.t === bangCandidate) ||
    urlDefaultBangObj ||
    localStorageDefaultBangObj;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // If the query is just a bang, use the domain
  if (cleanQuery === "")
    return selectedBang ? `https://${selectedBang.d}` : null;

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  if (!searchUrl) return null;

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

// Main routing logic
function init() {
  // Check if we're on the settings page (using hash routing)
  if (window.location.hash === "#settings") {
    renderSettingsPage();
    return;
  }

  // Check if we have a search query to redirect
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim();

  if (query) {
    doRedirect();
  } else {
    // No query, show the main search page
    renderMainPage();
  }
}

init();
