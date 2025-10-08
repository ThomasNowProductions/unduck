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

  // Search suggestions functionality
  let suggestionsContainer: HTMLDivElement | null = null;
  let selectedSuggestionIndex = -1;

  function createSuggestionsContainer() {
    if (suggestionsContainer) return suggestionsContainer;

    suggestionsContainer = document.createElement("div");
    suggestionsContainer.className = "search-suggestions";
    suggestionsContainer.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #fff;
      border: 2px solid #e0e0e0;
      border-top: none;
      border-radius: 0 0 16px 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
    `;

    // Add dark mode styles
    const darkModeStyles = document.createElement("style");
    darkModeStyles.textContent = `
      @media (prefers-color-scheme: dark) {
        .search-suggestions {
          background: #232323 !important;
          border-color: #2d2d2d !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
        }
        .search-suggestion {
          color: #fff !important;
        }
        .search-suggestion:hover,
        .search-suggestion.selected {
          background: #2d2d2d !important;
        }
        .search-suggestion-trigger {
          color: #cccccc !important;
        }
        .search-suggestion-name {
          color: #b0b0b0 !important;
        }
      }
    `;
    document.head.appendChild(darkModeStyles);

    return suggestionsContainer;
  }

  function showSuggestions(suggestions: typeof bangs) {
    if (suggestions.length === 0) {
      hideSuggestions();
      return;
    }

    const container = createSuggestionsContainer();
    container.innerHTML = "";

    suggestions.slice(0, 6).forEach((bang, index) => {
      const suggestion = document.createElement("div");
      suggestion.className = "search-suggestion";
      (suggestion as HTMLElement).style.cssText = `
        padding: 12px 20px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.2s;
      `;

      suggestion.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="search-suggestion-trigger" style="font-family: monospace; font-weight: 600; color: #888888; min-width: 40px;">!${bang.t}</span>
          <div style="flex: 1;">
            <div class="search-suggestion-name" style="font-size: 14px; color: #6b6b6b; font-weight: 500;">${bang.s}</div>
            ${bang.d ? `<div style="font-size: 12px; color: #888888; margin-top: 2px;">${bang.d}</div>` : ''}
          </div>
        </div>
      `;

      suggestion.addEventListener("mouseenter", () => {
        selectedSuggestionIndex = index;
        updateSuggestionSelection();
      });

      suggestion.addEventListener("mouseleave", () => {
        if (selectedSuggestionIndex === index) {
          selectedSuggestionIndex = -1;
          updateSuggestionSelection();
        }
      });

      suggestion.addEventListener("click", () => {
        selectSuggestion(bang);
      });

      container.appendChild(suggestion);
    });

    container.style.display = "block";
    selectedSuggestionIndex = -1;
    updateSuggestionSelection();
  }

  function updateSuggestionSelection() {
    if (!suggestionsContainer) return;

    const suggestions = suggestionsContainer.querySelectorAll(".search-suggestion");
    suggestions.forEach((suggestion, index) => {
      if (index === selectedSuggestionIndex) {
        suggestion.classList.add("selected");
        (suggestion as HTMLElement).style.backgroundColor = "#f8f8f8";
      } else {
        suggestion.classList.remove("selected");
        (suggestion as HTMLElement).style.backgroundColor = "transparent";
      }
    });
  }

  function hideSuggestions() {
    if (suggestionsContainer) {
      suggestionsContainer.style.display = "none";
    }
    selectedSuggestionIndex = -1;
  }

  function selectSuggestion(bang: typeof bangs[0]) {
    const query = `!${bang.t} `;
    searchInput.value = query;
    searchInput.focus();
    hideSuggestions();
    // Trigger search after a brief delay to allow the input to update
    setTimeout(() => {
      const event = new KeyboardEvent("keypress", { key: "Enter" });
      searchInput.dispatchEvent(event);
    }, 10);
  }

  function getSuggestions(searchTerm: string): typeof bangs {
    if (!searchTerm.trim()) return [];

    const normalizedSearch = searchTerm.toLowerCase();

    // If search starts with "!", search in bang triggers
    if (normalizedSearch.startsWith("!")) {
      const bangTrigger = normalizedSearch.slice(1);

      // Find exact match first
      const exactMatch = bangs.filter(b => b.t.toLowerCase() === bangTrigger);

      // Then find partial matches, excluding the exact match
      const partialMatches = bangs.filter(b =>
        b.t.toLowerCase().includes(bangTrigger) &&
        b.t.toLowerCase() !== bangTrigger
      );

      return [...exactMatch, ...partialMatches];
    }

    // If search doesn't start with "!", show popular bangs or bangs matching the search term
    if (normalizedSearch.length >= 2) {
      // Find matches in bang triggers and names
      const triggerMatches = bangs.filter(b =>
        b.t.toLowerCase().includes(normalizedSearch)
      );

      const nameMatches = bangs.filter(b =>
        b.s.toLowerCase().includes(normalizedSearch) &&
        !triggerMatches.includes(b)
      );

      return [...triggerMatches, ...nameMatches].slice(0, 6);
    }

    return [];
  }

  function handleSearchInput() {
    const query = searchInput.value;
    const suggestions = getSuggestions(query);

    if (suggestions.length > 0) {
      showSuggestions(suggestions);
    } else {
      hideSuggestions();
    }
  }

  // Add input event listener for real-time suggestions
  searchInput.addEventListener("input", handleSearchInput);

  // Add keyboard navigation
  searchInput.addEventListener("keydown", (e) => {
    if (!suggestionsContainer || suggestionsContainer.style.display === "none") {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        // Show suggestions if they're hidden and we have input
        const suggestions = getSuggestions(searchInput.value);
        if (suggestions.length > 0) {
          showSuggestions(suggestions);
          selectedSuggestionIndex = e.key === "ArrowDown" ? 0 : suggestions.length - 1;
          updateSuggestionSelection();
          e.preventDefault();
        }
      }
      return;
    }

    const suggestions = suggestionsContainer.querySelectorAll(".search-suggestion");

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
        updateSuggestionSelection();
        break;
      case "ArrowUp":
        e.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
        updateSuggestionSelection();
        break;
      case "Enter":
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          e.preventDefault();
          const selectedBang = getSuggestions(searchInput.value)[selectedSuggestionIndex];
          if (selectedBang) {
            selectSuggestion(selectedBang);
          }
        }
        break;
      case "Escape":
        hideSuggestions();
        break;
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (suggestionsContainer &&
        !suggestionsContainer.contains(e.target as Node) &&
        e.target !== searchInput) {
      hideSuggestions();
    }
  });

  // Position suggestions container relative to search input
  function positionSuggestionsContainer() {
    if (!suggestionsContainer) return;

    const searchBoxContainer = searchInput.closest(".search-box-container") as HTMLElement;
    if (searchBoxContainer) {
      searchBoxContainer.style.position = "relative";
      searchBoxContainer.appendChild(suggestionsContainer);
    }
  }

  // Position the suggestions container after DOM is ready
  setTimeout(positionSuggestionsContainer, 0);
}

function renderSettingsPage() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  // Use all bangs, sorted alphabetically by their display name

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
    const toast = app.querySelector<HTMLDivElement>("#toast")!;
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
  const app = document.querySelector<HTMLDivElement>("#app")!;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>("#output-url")!;
  const bangPicker = app.querySelector<HTMLSelectElement>("#bang-picker")!;
  const bangSearch = app.querySelector<HTMLInputElement>("#bang-search")!;

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
    const exactMatch = bangs.filter(b => b.t.toLowerCase() === normalizedSearch);
    // Then find partial matches, excluding the exact match
    const partialMatches = bangs.filter(b =>
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
    const toast = app.querySelector<HTMLDivElement>("#toast")!;
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

function getMultipleBangUrls() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  // Extract all bangs from the query using regex
  const bangMatches = query.match(/!(\S+)/gi);
  if (!bangMatches || bangMatches.length === 0) {
    return null;
  }

  const bangCandidates = bangMatches.map(match => match.slice(1).toLowerCase());

  // Get defaultBang from URL param if present
  const urlDefaultBang = url.searchParams.get("defaultBang")?.toLowerCase();
  const urlDefaultBangObj = urlDefaultBang ? bangs.find((b) => b.t === urlDefaultBang) : undefined;

  // Get defaultBang from localStorage or fallback to 'g'
  const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
  const localStorageDefaultBangObj = bangs.find((b) => b.t === LS_DEFAULT_BANG);

  // Remove all bangs from the query to get the search term
  const cleanQuery = query.replace(/!\S+/gi, "").trim();

  // If no search term provided, use domain URLs
  if (cleanQuery === "") {
    const urls: string[] = [];

    bangCandidates.forEach(bangCandidate => {
      // Precedence: explicit bang > url param > localStorage > 'g'
      const selectedBang =
        bangs.find((b) => b.t === bangCandidate) ||
        urlDefaultBangObj ||
        localStorageDefaultBangObj;

      if (selectedBang) {
        urls.push(`https://${selectedBang.d}`);
      }
    });

    return urls.length > 0 ? urls : null;
  }

  // Generate search URLs for each bang
  const urls: string[] = [];

  bangCandidates.forEach(bangCandidate => {
    // Precedence: explicit bang > url param > localStorage > 'g'
    const selectedBang =
      bangs.find((b) => b.t === bangCandidate) ||
      urlDefaultBangObj ||
      localStorageDefaultBangObj;

    if (selectedBang) {
      // Format of the url is:
      // https://www.google.com/search?q={{{s}}}
      const searchUrl = selectedBang.u.replace(
        "{{{s}}}",
        // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
        encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
      );
      urls.push(searchUrl);
    }
  });

  return urls.length > 0 ? urls : null;
}

function openMultipleTabs(urls: string[]) {
  // Open the first URL in the current tab
  if (urls.length > 0) {
    window.location.href = urls[0];
  }

  // Open the remaining URLs in new tabs with a small delay to ensure they open properly
  for (let i = 1; i < urls.length; i++) {
    setTimeout(() => {
      window.open(urls[i], '_blank');
    }, i * 100); // Stagger opening by 100ms each
  }
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
  // First check if there are multiple bangs in the query
  const multipleUrls = getMultipleBangUrls();
  if (multipleUrls && multipleUrls.length > 1) {
    // If multiple bangs found, open them in separate tabs
    openMultipleTabs(multipleUrls);
    return;
  }

  // Otherwise, use the original single bang logic
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
