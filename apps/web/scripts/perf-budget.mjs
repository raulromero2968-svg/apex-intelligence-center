#!/usr/bin/env node
/* eslint-disable no-console */

import fs from "fs";
import path from "path";
import zlib from "zlib";

const ROOT = process.cwd();
const ART_DIR = path.join(ROOT, "artifacts");
const REPORT = path.join(ART_DIR, "perf-budget.txt");

// Budget limits
const MAX_ROUTE_KB = Number(process.env.MAX_ROUTE_KB || 500);
const MAX_CHUNK_KB = Number(process.env.MAX_CHUNK_KB || 300);
const MAX_FIRST_LOAD_KB = Number(process.env.MAX_FIRST_LOAD_KB || 200);

// STRICT mode: CI || GITHUB_ACTIONS unless PERF_BUDGET_STRICT=0
const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const STRICT = isCI && process.env.PERF_BUDGET_STRICT !== "0";

fs.mkdirSync(ART_DIR, { recursive: true });
fs.writeFileSync(REPORT, "", "utf8");

const exists = (p) => {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
};

const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const gzSizeKB = (abs) => {
  try {
    const buf = fs.readFileSync(abs);
    const gz = zlib.gzipSync(buf, { level: 9 });
    return Math.ceil(gz.byteLength / 1024);
  } catch {
    return 0;
  }
};

const nextDir = path.join(ROOT, ".next");
if (!exists(nextDir)) {
  fs.appendFileSync(REPORT, "ℹ️  No .next directory. Run a build first.\n");
  process.exit(0);
}

// Read build manifest
let pages = {};
const buildManifestPath = path.join(nextDir, "build-manifest.json");
if (exists(buildManifestPath)) {
  try {
    const bm = readJSON(buildManifestPath);
    pages = bm.pages || {};
  } catch {
    // ignore parse errors
  }
}

const appBuildManifest = path.join(nextDir, "server", "app-build-manifest.json");
if (Object.keys(pages).length === 0 && exists(appBuildManifest)) {
  try {
    const am = readJSON(appBuildManifest);
    if (am.pages && typeof am.pages === "object") {
      pages = am.pages;
    }
  } catch {
    // ignore
  }
}

const staticDir = path.join(nextDir, "static");
const chunksDir = path.join(staticDir, "chunks");

const assetAbsolutePath = (rel) => {
  if (!rel) return null;
  if (rel.startsWith("/")) rel = rel.slice(1);
  const p1 = path.join(staticDir, rel);
  if (exists(p1)) return p1;
  const p2 = path.join(nextDir, rel);
  if (exists(p2)) return p2;
  if (rel.includes("/chunks/")) {
    const p3 = path.join(chunksDir, path.basename(rel));
    if (exists(p3)) return p3;
  }
  return null;
};

// Track all chunks for chunk budget check
const chunkSizes = new Map();

// Track route sizes
const routeOffenders = [];
const routeReportLines = [];
const IGNORE = new Set(["/_app", "/_error", "/_document"]);

// Check routes
for (const [route, assets] of Object.entries(pages)) {
  if (!assets || IGNORE.has(route)) continue;
  const arr = Array.isArray(assets) ? assets : Object.values(assets || {});
  let total = 0;
  const parts = [];

  for (const rel of arr) {
    if (typeof rel !== "string" || !rel.endsWith(".js")) continue;
    const abs = assetAbsolutePath(rel);
    if (!abs) continue;
    const kb = gzSizeKB(abs);
    total += kb;
    parts.push([kb, rel]);
    
    // Track chunk size for chunk budget
    if (rel.includes("/chunks/")) {
      const chunkName = path.basename(rel);
      if (!chunkSizes.has(chunkName) || chunkSizes.get(chunkName) < kb) {
        chunkSizes.set(chunkName, kb);
      }
    }
  }

  if (!parts.length) continue;

  parts.sort((a, b) => b[0] - a[0]);
  routeReportLines.push(
    `Route: ${route}\n  Total: ${total} KB gz (limit: ${MAX_ROUTE_KB} KB)\n  Top:\n    ${parts
      .slice(0, 5)
      .map(([k, r]) => `${String(k).padStart(4, " ")} KB  ${r}`)
      .join("\n    ")}\n`
  );

  if (total > MAX_ROUTE_KB) {
    routeOffenders.push([total, route, MAX_ROUTE_KB]);
  }
}

// Check chunks
const chunkOffenders = [];
const chunkReportLines = [];
for (const [chunkName, kb] of chunkSizes.entries()) {
  chunkReportLines.push([kb, chunkName]);
  if (kb > MAX_CHUNK_KB) {
    chunkOffenders.push([kb, chunkName, MAX_CHUNK_KB]);
  }
}
chunkReportLines.sort((a, b) => b[0] - a[0]);

// Check first load (typically the main page "/")
let firstLoadKB = 0;
const firstLoadAssets = [];
if (pages["/"]) {
  const assets = Array.isArray(pages["/"]) ? pages["/"] : Object.values(pages["/"] || {});
  for (const rel of assets) {
    if (typeof rel !== "string" || !rel.endsWith(".js")) continue;
    const abs = assetAbsolutePath(rel);
    if (!abs) continue;
    const kb = gzSizeKB(abs);
    firstLoadKB += kb;
    firstLoadAssets.push([kb, rel]);
  }
}
firstLoadAssets.sort((a, b) => b[0] - a[0]);

// Write report
fs.appendFileSync(
  REPORT,
  `# Performance Budget (gzipped)\n` +
  `Route limit: ${MAX_ROUTE_KB} KB | Chunk limit: ${MAX_CHUNK_KB} KB | First load limit: ${MAX_FIRST_LOAD_KB} KB\n` +
  `Strict mode: ${STRICT ? "on" : "off"} (CI: ${isCI ? "yes" : "no"})\n\n`
);

// Route budget section
if (routeReportLines.length > 0) {
  fs.appendFileSync(REPORT, `## Route Budget\n\n`);
  routeReportLines
    .sort((a, b) => {
      const findTotal = (line) => {
        const match = line.match(/Total:\s+(\d+)/);
        return match ? Number(match[1]) : 0;
      };
      return findTotal(b) - findTotal(a);
    })
    .forEach((line) => fs.appendFileSync(REPORT, line + "\n"));
} else {
  fs.appendFileSync(REPORT, `## Route Budget\nℹ️  No JS client assets resolved for routes.\n\n`);
}

// Chunk budget section
if (chunkReportLines.length > 0) {
  fs.appendFileSync(REPORT, `## Chunk Budget\n\n`);
  chunkReportLines.slice(0, 20).forEach(([kb, name]) => {
    fs.appendFileSync(REPORT, `${String(kb).padStart(6, " ")} KB  ${name}\n`);
  });
  if (chunkReportLines.length > 20) {
    fs.appendFileSync(REPORT, `... and ${chunkReportLines.length - 20} more chunks\n`);
  }
  fs.appendFileSync(REPORT, "\n");
} else {
  fs.appendFileSync(REPORT, `## Chunk Budget\nℹ️  No chunks found.\n\n`);
}

// First load budget section
fs.appendFileSync(REPORT, `## First Load Budget\n\n`);
if (firstLoadAssets.length > 0) {
  fs.appendFileSync(REPORT, `Total: ${firstLoadKB} KB gz (limit: ${MAX_FIRST_LOAD_KB} KB)\n`);
  fs.appendFileSync(REPORT, `Top assets:\n`);
  firstLoadAssets.slice(0, 10).forEach(([kb, rel]) => {
    fs.appendFileSync(REPORT, `  ${String(kb).padStart(4, " ")} KB  ${rel}\n`);
  });
} else {
  fs.appendFileSync(REPORT, `ℹ️  No first load assets found.\n`);
}
fs.appendFileSync(REPORT, "\n");

// Summary of breaches
const allBreaches = [];
if (routeOffenders.length > 0) {
  fs.appendFileSync(REPORT, `❌ Route budget breaches (${routeOffenders.length}):\n`);
  routeOffenders
    .sort((a, b) => b[0] - a[0])
    .forEach(([kb, route, limit]) => {
      fs.appendFileSync(REPORT, `  - ${route}: ${kb} KB gz (limit: ${limit} KB)\n`);
      allBreaches.push(`Route ${route}: ${kb} KB > ${limit} KB`);
    });
}

if (chunkOffenders.length > 0) {
  fs.appendFileSync(REPORT, `❌ Chunk budget breaches (${chunkOffenders.length}):\n`);
  chunkOffenders
    .sort((a, b) => b[0] - a[0])
    .forEach(([kb, name, limit]) => {
      fs.appendFileSync(REPORT, `  - ${name}: ${kb} KB gz (limit: ${limit} KB)\n`);
      allBreaches.push(`Chunk ${name}: ${kb} KB > ${limit} KB`);
    });
}

if (firstLoadKB > MAX_FIRST_LOAD_KB) {
  fs.appendFileSync(
    REPORT,
    `❌ First load budget breach: ${firstLoadKB} KB gz (limit: ${MAX_FIRST_LOAD_KB} KB)\n`
  );
  allBreaches.push(`First load: ${firstLoadKB} KB > ${MAX_FIRST_LOAD_KB} KB`);
}

if (allBreaches.length === 0) {
  fs.appendFileSync(REPORT, `✅ All performance budgets met!\n`);
  process.exit(0);
}

// Fail on breaches if STRICT mode
if (STRICT) {
  fs.appendFileSync(REPORT, `\n❌ Strict mode: failing due to performance budget breach(es).\n`);
  console.error(`Performance budget breaches:\n${allBreaches.join("\n")}`);
  process.exit(1);
}

fs.appendFileSync(REPORT, `\n⚠️  Warnings only (STRICT=0). Consider optimizing bundle sizes.\n`);
process.exit(0);

