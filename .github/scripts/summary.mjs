// Turns the merged Playwright JSON report into the Markdown table shown on the workflow run page.
import { readFileSync } from "node:fs";

const report = JSON.parse(readFileSync(process.argv[2], "utf8"));
const { expected, unexpected, flaky, skipped, duration } = report.stats;

console.log(`## Playwright E2E

| Tests | Passed | Failed | Flaky | Skipped | Wall time | Parallel runners | Workers per runner |
|---:|---:|---:|---:|---:|---:|---:|---:|
| ${expected + unexpected + flaky + skipped} | ${expected} | ${unexpected} | ${flaky} | ${skipped} | ${(duration / 1000).toFixed(1)} s | ${process.env.SHARDS} | ${process.env.E2E_WORKERS} |
`);
