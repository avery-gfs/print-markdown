// UI wiring: controls, status line, and load/clear flows.

import { fetchMarkdown } from "./fetch-markdown.js";
import { markdownToHtml } from "./markdown.js";
import { SectionRemovals } from "./sections.js";
import { loadState, saveState } from "./storage.js";

const fileInput = document.getElementById("fileInput");
const urlInput = document.getElementById("urlInput");
const loadUrlButton = document.getElementById("loadUrlButton");
const printButton = document.getElementById("printButton");
const clearButton = document.getElementById("clearButton");
const restoreAllButton = document.getElementById("restoreAllButton");
const output = document.getElementById("output");
const status = document.getElementById("status");

const EMPTY_HTML = "<p class='empty'>No markdown loaded yet.</p>";

// URL of the last successful load; loading it again counts as a reload,
// which keeps removed sections removed.
let lastLoadedUrl = "";

const removals = new SectionRemovals(output, removalsChanged);

function persist() {
  saveState({
    url: lastLoadedUrl,
    removedSections: removals.sections,
    removedHeaders: removals.headers,
  });
}

// --- status line ---------------------------------------------------------

let statusBase = status.textContent;

function setStatus(message) {
  statusBase = message;
  renderStatus();
}

function renderStatus() {
  const count = removals.count;
  status.textContent = count ? `${statusBase} (${count} removed)` : statusBase;
  restoreAllButton.disabled = count === 0;
}

function removalsChanged() {
  removals.apply();
  renderStatus();
  persist();
}

// --- load button -----------------------------------------------------------

function isReload() {
  return Boolean(lastLoadedUrl) && urlInput.value.trim() === lastLoadedUrl;
}

function updateLoadButton() {
  const reload = isReload();
  loadUrlButton.textContent = reload ? "Reload" : "Load URL";
  loadUrlButton.title = reload ? "Re-fetch this link, keeping removed sections removed" : "";
}

function setLastLoadedUrl(url) {
  lastLoadedUrl = url;
  persist();
  updateLoadButton();
}

// --- loading ---------------------------------------------------------------

function render(markdownText, sourceLabel) {
  output.innerHTML =
    markdownToHtml(markdownText) || "<p class='empty'>Markdown rendered to empty output.</p>";
  removals.decorate();
  removals.apply();
  setStatus(`Rendered markdown from ${sourceLabel}.`);
}

async function loadFromUrl(input) {
  const keepRemovals = isReload();
  let result;
  try {
    result = await fetchMarkdown(input, (url) => setStatus(`Fetching: ${url}`));
  } catch (error) {
    setStatus(error.message);
    return;
  }

  if (!keepRemovals) {
    removals.reset();
  }
  render(result.text, result.url);
  setLastLoadedUrl(input.trim());
}

async function loadFromFile(file) {
  if (!file) {
    setStatus("Choose a file first.");
    return;
  }
  const text = await file.text();
  removals.reset();
  setLastLoadedUrl("");
  render(text, file.name);
}

function clear() {
  fileInput.value = "";
  urlInput.value = "";
  removals.reset();
  setLastLoadedUrl("");
  output.innerHTML = EMPTY_HTML;
  setStatus("Cleared.");
}

// --- events ----------------------------------------------------------------

fileInput.addEventListener("change", () => loadFromFile(fileInput.files?.[0]));
loadUrlButton.addEventListener("click", () => loadFromUrl(urlInput.value));
urlInput.addEventListener("input", updateLoadButton);
urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    loadFromUrl(urlInput.value);
  }
});
printButton.addEventListener("click", () => window.print());
restoreAllButton.addEventListener("click", () => {
  removals.reset();
  removalsChanged();
});
clearButton.addEventListener("click", clear);

// --- startup ---------------------------------------------------------------

const saved = loadState();
if (saved) {
  lastLoadedUrl = saved.url;
  urlInput.value = saved.url;
  removals.load(saved);
  setStatus("Restored last URL. Press Reload to load it.");
}
updateLoadButton();
