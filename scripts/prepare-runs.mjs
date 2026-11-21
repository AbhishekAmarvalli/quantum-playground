/**
 * docs/hardware_runs stays the source of truth. This copies every listed image
 * into public/hardware_runs and writes the manifest the Runs page fetches, so
 * adding a real IBM capture is still just "drop PNG + JSON in the folder".
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "docs", "hardware_runs");
const outDir = path.join(root, "public", "hardware_runs");

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const entries = [];

if (fs.existsSync(srcDir)) {
  for (const file of fs.readdirSync(srcDir)) {
    if (!file.endsWith(".json")) continue;
    const full = path.join(srcDir, file);
    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(full, "utf8"));
    } catch (err) {
      console.warn(`prepare-runs: skipping ${file} (invalid JSON: ${err.message})`);
      continue;
    }
    if (!meta || typeof meta !== "object" || !meta.image) {
      console.warn(`prepare-runs: skipping ${file} (no "image" field)`);
      continue;
    }
    const imgSrc = path.join(srcDir, meta.image);
    if (!fs.existsSync(imgSrc)) {
      console.warn(`prepare-runs: skipping ${file} (missing image ${meta.image})`);
      continue;
    }
    const imageName = path.basename(meta.image);
    fs.copyFileSync(imgSrc, path.join(outDir, imageName));
    entries.push({ ...meta, image: `/hardware_runs/${imageName}` });
  }
}

entries.sort((a, b) => String(b.timestamp ?? "").localeCompare(String(a.timestamp ?? "")));
fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  `${JSON.stringify(entries, null, 2)}\n`,
  "utf8",
);

console.log(`prepare-runs: ${entries.length} run(s) -> public/hardware_runs`);
