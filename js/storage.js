// Persist the last loaded URL and its removals across page visits.

const STORAGE_KEY = "markdown-print-state";

export function saveState({ url, removedSections, removedHeaders }) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        url,
        removedSections: [...removedSections],
        removedHeaders: [...removedHeaders],
      })
    );
  } catch {
    // storage unavailable; ignore
  }
}

// Returns { url, removedSections, removedHeaders } or null if nothing usable is stored.
export function loadState() {
  let state;
  try {
    state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
  if (!state?.url) {
    return null;
  }
  return {
    url: state.url,
    removedSections: state.removedSections ?? [],
    removedHeaders: state.removedHeaders ?? [],
  };
}
