import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "agent-run",
  title: "Agent run",
  summary: "Watch an agent work through a task: a plan, tool calls, sub-agents and a running token count.",
  description:
    "Type a task, or pick an example, and watch an agent work through it. A plan forms, steps tick off, tool calls open to show their arguments, sub-agents fan out across a small graph, and tokens and seconds count up until the summary lands. It is all scripted and runs offline.",
  about: [
    "The run is a deterministic script, not a model: what you type picks and fills in one of a few prepared runs, which then stream in on a timeline so the pacing feels real without any network or AI calls. The planning line shimmers with a gradient clipped to the text, finished steps check off with a small spring, and tool calls fold away so their arguments are there when you want them and out of the way when you don't.",
    "The orchestration graph draws curved edges from the lead agent to its sub-agents, with packets travelling along them while work is in flight, and the token and time counters roll like odometers.",
  ],
  uses: ["React", "SVG", "CSS animations"],
  category: "components",
  // 204 × 252
  tile: { aspect: 204 / 252 },
  stage: { aspect: 4 / 5, minHeight: 440 },
  controlsHint: "Type a task and press Enter, or pick an example",
};
