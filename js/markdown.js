import { marked } from "https://esm.sh/marked@13.0.3";
import { markedHighlight } from "https://esm.sh/marked-highlight@2.1.2";
import hljs from "https://esm.sh/highlight.js@11.11.1";
import DOMPurify from "https://esm.sh/dompurify@3.2.6";

marked.use(
  markedHighlight({
    highlight(code, lang) {
      // Untagged code blocks are left plain; marked-highlight escapes
      // the returned text when it is unchanged.
      if (!lang) return code;
      if (hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
  })
);

marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
});

// Markdown text -> sanitized HTML string.
export function markdownToHtml(markdownText) {
  const rendered = marked.parse(markdownText ?? "");
  return DOMPurify.sanitize(rendered, { USE_PROFILES: { html: true } });
}
