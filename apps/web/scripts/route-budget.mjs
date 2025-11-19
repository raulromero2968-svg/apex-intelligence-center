#!/usr/bin/env node
/* eslint-disable no-console */

import fs from "fs";
import path from "path";
import zlib from "zlib";

const ROOT = process.cwd();
const ART_DIR = path.join(ROOT, "artifacts");
const REPORT = path.join(ART_DIR, "route-budget.txt");
const MAX_ROUTE_KB = Number(process.env.MAX_ROUTE_KB || 500);
const STRICT = process.env.STRICT_ROUTE === "1";

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
const budgetsPath = path.join(ROOT, "budgets.json");
let routeBudgets = [];
let temporaryAllow = [];
if (exists(budgetsPath)) {
  try {
    const bj = readJSON(budgetsPath);
    routeBudgets = Array.isArray(bj.routeBudgets) ? bj.routeBudgets : [];
    temporaryAllow = Array.isArray(bj.temporaryAllow) ? bj.temporaryAllow : [];
  } catch {
    // ignore parse errors and fallback to env defaults
  }
}

const budgetFor = (route) => {
  let limit = MAX_ROUTE_KB;
  for (const entry of routeBudgets) {
    if (!entry || !entry.pattern) continue;
    try {
      if (new RegExp(entry.pattern).test(route)) {
        const value = Number(entry.maxKB);
        if (!Number.isNaN(value)) {
          limit = value;
        }
      }
    } catch {
      // invalid regex; skip
    }
  }
  for (const allow of temporaryAllow) {
    if (!allow || !allow.route || !allow.until) continue;
    try {
      if (new RegExp(allow.route).test(route)) {
        const until = new Date(String(allow.until));
        if (!Number.isNaN(until.valueOf()) && new Date() <= until) {
          const bump = Number(allow.maxKB);
          if (!Number.isNaN(bump)) {
            limit = Math.max(limit, bump);
          }
        }
      }
    } catch {
      // ignore malformed entries
    }
  }
  return limit;
};
if (!exists(nextDir)) {
  fs.appendFileSync(REPORT, "ℹ️  No .next directory. Run a build first.\n");
  process.exit(0);
}

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

if (Object.keys(pages).length === 0) {
  fs.appendFileSync(REPORT, "ℹ️  No route mapping found in Next manifests. Skipping.\n");
  process.exit(0);
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

const IGNORE = new Set(["/_app", "/_error", "/_document"]);
const reportLines = [];
const offenders = [];

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
  }

  if (!parts.length) continue;

  parts.sort((a, b) => b[0] - a[0]);
  const limit = budgetFor(route);
  reportLines.push(
    `Route: ${route}\n  Total: ${total} KB gz (limit: ${limit} KB)\n  Top:\n    ${parts
      .slice(0, 5)
      .map(([k, r]) => `${String(k).padStart(4, " ")} KB  ${r}`)
      .join("\n    ")}\n`
  );

  if (total > limit) {
    offenders.push([total, route, limit]);
  }
}

reportLines.sort((a, b) => {
  const findTotal = (line) => {
    const match = line.match(/Total:\s+(\d+)/);
    return match ? Number(match[1]) : 0;
  };
  return findTotal(b) - findTotal(a);
});

if (!reportLines.length) {
  fs.appendFileSync(REPORT, "ℹ️  No JS client assets resolved for routes.\n");
  process.exit(0);
}

fs.appendFileSync(
  REPORT,
  `# Route Budget (gz)\nMax per route: ${MAX_ROUTE_KB} KB (default) | Strict: ${STRICT ? "on" : "off"}\n\n`
);
for (const line of reportLines) {
  fs.appendFileSync(REPORT, line + "\n");
}

if (offenders.length) {
  fs.appendFileSync(REPORT, `\n❌ Route budget breaches (${offenders.length}):\n`);
  offenders
    .sort((a, b) => b[0] - a[0])
    .forEach(([kb, route, limit]) =>
      fs.appendFileSync(REPORT, `  - ${route}: ${kb} KB gz (limit: ${limit} KB)\n`)
    );
  if (STRICT) {
    process.exit(1);
  }
}

process.exit(0);

