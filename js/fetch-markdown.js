import { buildCandidateUrls } from "./github-urls.js";

// Try each candidate URL for `input` until one returns markdown.
// Calls onAttempt(url) before each fetch. Resolves to { text, url };
// rejects with the last failure's message if none work.
export async function fetchMarkdown(input, onAttempt = () => {}) {
  const candidates = buildCandidateUrls(input);
  if (candidates.length === 0) {
    throw new Error("Enter a URL first.");
  }

  let lastError = "Unable to fetch markdown from the provided URL.";
  for (const url of candidates) {
    onAttempt(url);

    let response;
    try {
      response = await fetch(url, {
        headers: { Accept: "text/plain, text/markdown; q=0.9, */*; q=0.8" },
      });
    } catch (error) {
      lastError = `Network/CORS error for ${url}: ${error.message}`;
      continue;
    }

    if (!response.ok) {
      lastError = `HTTP ${response.status} ${response.statusText} for ${url}`;
      continue;
    }

    const text = await response.text();
    if (/<!doctype html>|<html[\s>]/i.test(text.slice(0, 300))) {
      lastError = `Fetched HTML page instead of markdown from ${url}`;
      continue;
    }

    return { text, url };
  }

  throw new Error(lastError);
}
