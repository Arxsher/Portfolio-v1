// Temporary QA page for the github area (the integration step deletes preview-* routes).
//
// 1. the real section from data/contributions.json
// 2. the empty state (no data yet)
// 3. a full year of zero days, to check the 53-week layout (scrolls at the minimum cell size)

import { GitHubGraph, type Contributions } from "@/components/home/github";
import contributions from "@/data/contributions.json";

const empty: Contributions = { username: contributions.username, year: contributions.year, total: 0, days: [] };

const fullYear: Contributions = {
  username: contributions.username,
  year: contributions.year,
  total: 0,
  days: Array.from({ length: 365 }, (_, i) => ({
    date: new Date(Date.UTC(contributions.year, 0, 1 + i)).toISOString().slice(0, 10),
    count: 0,
    level: 0,
  })),
};

export default function PreviewGitHub() {
  return (
    <>
      <GitHubGraph />
      <GitHubGraph id="github-empty" data={empty} />
      <GitHubGraph id="github-full-year" data={fullYear} />
    </>
  );
}
