import { bangs } from "./bang";
import "./global.css";

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  // Use all bangs, sorted alphabetically by their display name
  const allBangs = bangs
    .map(b => ({ t: b.t, s: b.s }))
    .sort((a, b) => a.s.localeCompare(b.s));

  app.innerHTML = `
    <div class="main-bg">
      <div class="card-container">
        <header class="header">
          <img src="/search.svg" alt="Unduck logo" class="logo" />
          <div>
            <h1 class="title">Und*ck</h1>
            <p class="tagline">A better default search engine <span class="accent">with bangs!</span></p>
          </div>
        </header>
        <div class="content-container">
          <p class="desc">DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
          <div class="url-container vertical">
            <div class="input-group">
              <span class="input-icon"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              <input id="bang-search" type="text" placeholder="Search for a bang (e.g. Google, !yt, Wikipedia)" class="url-input with-icon" />
            </div>
            <select id="bang-picker" class="url-input" size="6">
              <option value="">Google (!g, default)</option>
              ${allBangs.map(b => `<option value="${b.t}">${b.s} (!${b.t})</option>`).join("")}
            </select>
          </div>
          <div class="url-container"> 
            <input 
              type="text" 
              class="url-input"
              id="output-url"
              value="https://unduck-me.vercel.app/?q=%s"
              readonly 
            />
            <button class="copy-button" title="Copy URL">
              <img src="/clipboard.svg" alt="Copy" />
            </button>
          </div>
        </div>
      </div>
      <div class="toast" id="toast" style="display:none"></div>
      <footer class="footer">
        <span>Made by <a href="https://github.com/t3dotgg/unduck" target="_blank">t3dotgg</a> and modified by <a href="https://github.com/thomasnowproductions/unduck" target="_blank">ThomasNow Productions</a></span>
      </footer>
    </div>
  `;

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

doRedirect();
