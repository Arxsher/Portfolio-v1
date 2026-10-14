// Fetches this year's GitHub contribution calendar into data/contributions.json.
// Runs before every build (and on the daily scheduled deploy). If the request
// fails, the last committed file is kept so the build never breaks.
import { readFile, writeFile } from "node:fs/promises";

const config = JSON.parse(await readFile(new URL("../content/github.json", import.meta.url), "utf8"));
const year = new Date().getUTCFullYear();
const file = new URL("../data/contributions.json", import.meta.url);

try {
  const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${config.username}?y=${year}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const today = new Date().toISOString().slice(0, 10);
  const days = json.contributions
    .filter((d) => d.date <= today)
    .map(({ date, count, level }) => ({ date, count, level }));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  await writeFile(file, JSON.stringify({ username: config.username, year, total, updatedAt: today, days }, null, 2) + "\n");
  console.log(`contributions: ${total} in ${year} (${days.length} days)`);
} catch (err) {
  console.warn(`contributions: fetch failed (${err.message}), keeping existing data`);
}
