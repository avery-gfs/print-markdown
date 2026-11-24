// Turn a user-entered URL into the list of raw-markdown URLs to try, in order.
// GitHub page URLs (blob, tree, repo root) are mapped to raw.githubusercontent.com.

const README_NAMES = ["README.md", "Readme.md", "readme.md", "README.markdown", "README"];

function rawUrl(owner, repo, branch, path) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

function readmeCandidates(owner, repo, branch, dirPath = "") {
  const prefix = dirPath ? `${dirPath.replace(/^\/+|\/+$/g, "")}/` : "";
  return README_NAMES.map((name) => rawUrl(owner, repo, branch, `${prefix}${name}`));
}

export function buildCandidateUrls(input) {
  const cleaned = input.trim();
  if (!cleaned) {
    return [];
  }

  let parsed;
  try {
    parsed = new URL(cleaned);
  } catch {
    return [cleaned];
  }

  if (parsed.hostname !== "github.com") {
    return [cleaned];
  }

  const pathParts = parsed.pathname.split("/").filter(Boolean);
  if (pathParts.length < 2) {
    return [cleaned];
  }

  const [owner, repo, marker, branch, ...restPath] = pathParts;

  if (marker === "blob" && branch && restPath.length > 0) {
    return [rawUrl(owner, repo, branch, restPath.join("/"))];
  }

  if (marker === "tree" && branch) {
    return readmeCandidates(owner, repo, branch, restPath.join("/"));
  }

  // Repo root pages (with or without #readme): try common README locations on main/master.
  const pathAfterRepo = pathParts.slice(2).join("/");
  return [
    ...readmeCandidates(owner, repo, "main", pathAfterRepo),
    ...readmeCandidates(owner, repo, "master", pathAfterRepo),
  ];
}
