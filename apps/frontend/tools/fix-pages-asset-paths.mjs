import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("out");
const rawBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}`
    : "");

const basePath = rawBasePath && rawBasePath !== "/"
  ? `/${rawBasePath.replace(/^\/+|\/+$/g, "")}`
  : "";

if (!basePath) {
  console.log("[fix-pages-assets] base path is empty, skipping");
  process.exit(0);
}

if (!fs.existsSync(outDir)) {
  console.error(`[fix-pages-assets] out directory not found: ${outDir}`);
  process.exit(1);
}

const publicDir = path.resolve("public");
if (!fs.existsSync(publicDir)) {
  console.error(`[fix-pages-assets] public directory not found: ${publicDir}`);
  process.exit(1);
}

function getPublicAssets(dir, root = dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getPublicAssets(fullPath, root, files);
      continue;
    }

    const relativePath = path.relative(root, fullPath).split(path.sep).join("/");
    files.push(`/${relativePath}`);
  }

  return files;
}

const targetAssets = getPublicAssets(publicDir);
const textExtensions = new Set([
  ".html",
  ".js",
  ".txt",
  ".json",
  ".xml",
  ".map",
  ".webmanifest"
]);

const escapedBasePath = basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patchContent(content) {
  let updated = content;

  for (const asset of targetAssets) {
    const escapedAsset = escapeRegex(asset);
    const regex = new RegExp(`(?<![A-Za-z0-9:])(?<!${escapedBasePath})${escapedAsset}`, "g");
    updated = updated.replace(regex, `${basePath}${asset}`);
  }

  return updated;
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(ext)) {
      continue;
    }

    const original = fs.readFileSync(fullPath, "utf8");
    const updated = patchContent(original);

    if (updated !== original) {
      fs.writeFileSync(fullPath, updated, "utf8");
    }
  }
}

walk(outDir);

// Ensure GitHub Pages does not run Jekyll filtering, which would ignore `/_next` assets.
const noJekyllPath = path.join(outDir, ".nojekyll");
if (!fs.existsSync(noJekyllPath)) {
  fs.writeFileSync(noJekyllPath, "", "utf8");
}

console.log(
  `[fix-pages-assets] patched out/* using base path ${basePath} for ${targetAssets.length} public assets`
);
