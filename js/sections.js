// Removing headings / whole sections from the rendered document.
//
// Headings get a stable key (tag + text + occurrence) so removals can be
// re-applied after the same document is re-rendered.

const HEADING_RE = /^H[1-6]$/;

function headingLevel(el) {
  return HEADING_RE.test(el.tagName) ? Number(el.tagName[1]) : null;
}

// The heading plus every following sibling up to the next heading of equal or higher rank.
function sectionElements(heading) {
  const level = headingLevel(heading);
  const elements = [heading];
  let next = heading.nextElementSibling;
  while (next) {
    const nextLevel = headingLevel(next);
    if (nextLevel !== null && nextLevel <= level) {
      break;
    }
    elements.push(next);
    next = next.nextElementSibling;
  }
  return elements;
}

function makeToolButton(label, title, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.title = title;
  button.addEventListener("click", onClick);
  return button;
}

export class SectionRemovals {
  // container: element holding the rendered markdown.
  // onChange: called after the user removes something.
  constructor(container, onChange = () => {}) {
    this.container = container;
    this.onChange = onChange;
    this.sections = new Set(); // keys whose whole section is removed
    this.headers = new Set(); // keys where just the heading is removed
  }

  get count() {
    return this.sections.size + this.headers.size;
  }

  load({ removedSections = [], removedHeaders = [] }) {
    removedSections.forEach((k) => this.sections.add(k));
    removedHeaders.forEach((k) => this.headers.add(k));
  }

  reset() {
    this.sections.clear();
    this.headers.clear();
  }

  headings() {
    return [...this.container.children].filter((el) => headingLevel(el) !== null);
  }

  // Give each heading its key and remove button; call once per render.
  // h1 gets "remove header" (just the heading); h2–h6 get "remove section".
  decorate() {
    const seen = new Map();
    for (const heading of this.headings()) {
      const base = `${heading.tagName}|${heading.textContent.trim()}`;
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      const key = `${base}|${n}`;
      heading.dataset.sectionKey = key;

      const tools = document.createElement("span");
      tools.className = "section-tools";
      tools.append(
        headingLevel(heading) === 1
          ? makeToolButton("✕ header", "Remove just this heading", () =>
              this.#remove(this.headers, key)
            )
          : makeToolButton("✕ section", "Remove this heading and its section", () =>
              this.#remove(this.sections, key)
            )
      );
      heading.append(tools);
    }
  }

  // Hide removed headings/sections according to the current sets.
  apply() {
    this.container.querySelectorAll(".removed").forEach((el) => el.classList.remove("removed"));
    for (const heading of this.headings()) {
      const key = heading.dataset.sectionKey;
      if (this.sections.has(key)) {
        sectionElements(heading).forEach((el) => el.classList.add("removed"));
      } else if (this.headers.has(key)) {
        heading.classList.add("removed");
      }
    }
  }

  #remove(set, key) {
    set.add(key);
    this.apply();
    this.onChange();
  }
}
