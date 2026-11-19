// Fetches the GitHub contribution calendar into two files:
//   data/contributions.json       this calendar year (Commit city and the lab)
//   data/contributions-last.json  the last 12 months, like the count on the
//                                 GitHub profile (the home page graph)
// Runs before every build (and on the daily scheduled deploy). If a request
// fails, the last committed file is kept so the build never breaks. The home
// page graph also refreshes itself in the browser, so it never goes stale.
import { readFile, writeFile } from "node:fs/promises";

const config = JSON.parse(await readFile(new URL("../content/github.json", import.meta.url), "utf8"));
const today = new Date().toISOString().slice(0, 10);
const year = Number(today.slice(0, 4));

async function save(query, file, extra) {
  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${config.username}?y=${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const days = json.contributions
      .filter((d) => d.date <= today)
      .map(({ date, count, level }) => ({ date, count, level }));
    const total = days.reduce((sum, d) => sum + d.count, 0);
    const out = { username: config.username, ...extra, total, updatedAt: today, days };
    await writeFile(new URL(`../data/${file}`, import.meta.url), JSON.stringify(out, null, 2) + "\n");
    console.log(`contributions: ${total} (${query}, ${days.length} days) -> data/${file}`);
  } catch (err) {
    console.warn(`contributions: ${query} fetch failed (${err.message}), keeping data/${file}`);
  }
}

await save(String(year), "contributions.json", { year });
await save("last", "contributions-last.json", { year, range: "last" });
