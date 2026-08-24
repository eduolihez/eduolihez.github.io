#!/usr/bin/env node
// Daily CISA KEV (Known Exploited Vulnerabilities) watcher.
// Fetches the catalog, diffs it against the last known state committed in
// src/data/kev.json, and updates the rolling "recent additions" window that
// the /tools/kev-watch page renders at build time.
//
// Run by .github/workflows/kev-watch.yml once a day.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const KEV_URL =
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const DATA_FILE = path.join(ROOT, "src", "data", "kev.json");

// Keep the page fast and the diff readable: only entries added within this
// window are shown, capped at MAX_ENTRIES regardless.
const WINDOW_DAYS = 45;
const MAX_ENTRIES = 150;

async function fetchKev() {
  const res = await fetch(KEV_URL, {
    headers: { "User-Agent": "eduolihez.github.io-kev-watch/1.0" },
  });
  if (!res.ok) throw new Error(`KEV fetch failed: HTTP ${res.status}`);
  return res.json();
}

async function loadState() {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null; // first run
  }
}

function daysAgo(dateStr) {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return Infinity;
  return (Date.now() - then) / 86_400_000;
}

async function main() {
  const catalog = await fetchKev();
  const vulns = catalog.vulnerabilities || [];
  const currentIds = new Set(vulns.map((v) => v.cveID));
  const byId = new Map(vulns.map((v) => [v.cveID, v]));

  const prev = await loadState();
  const firstRun = !prev;
  const seenIds = new Set(prev?.seenIds || []);

  // On the very first run there's no "new since yesterday" to diff against.
  // Seed the page with real recent history instead of an empty state: every
  // CVE actually added to the catalog within the window, not anything
  // fabricated.
  const newIds = firstRun
    ? vulns.filter((v) => daysAgo(v.dateAdded) <= WINDOW_DAYS).map((v) => v.cveID)
    : [...currentIds].filter((id) => !seenIds.has(id));

  const newEntries = newIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((v) => ({
      cveID: v.cveID,
      vendorProject: v.vendorProject,
      product: v.product,
      vulnerabilityName: v.vulnerabilityName,
      dateAdded: v.dateAdded,
      dueDate: v.dueDate || null,
      shortDescription: (v.shortDescription || "").trim(),
      knownRansomware: v.knownRansomwareCampaignUse === "Known",
    }));

  const merged = [...newEntries, ...(prev?.recentAdditions || [])];
  const dedup = [...new Map(merged.map((e) => [e.cveID, e])).values()];
  const recentAdditions = dedup
    .filter((e) => daysAgo(e.dateAdded) <= WINDOW_DAYS)
    .sort((a, b) => (a.dateAdded < b.dateAdded ? 1 : -1))
    .slice(0, MAX_ENTRIES);

  const today = new Date().toISOString().slice(0, 10);
  const output = {
    lastUpdated: today,
    totalTracked: currentIds.size,
    newToday: newEntries.length,
    firstRun,
    recentAdditions,
    seenIds: [...currentIds].sort(),
  };

  await writeFile(DATA_FILE, JSON.stringify(output, null, 2) + "\n", "utf-8");
  console.log(
    `kev.json updated: ${output.newToday} new, ${output.totalTracked} tracked total` +
      (firstRun ? " (baseline established)" : ""),
  );
}

main().catch((err) => {
  console.error("update-kev failed:", err);
  process.exit(1);
});
