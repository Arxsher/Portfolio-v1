import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "agent-run",
  title: "Agent run",
  summary: "An agent run card: a plan that checks off, tool calls you can open, sub-agents on a live graph and a rolling token count.",
  description:
    "Give the agent a task, or pick an example, and watch the run stream in: a plan that checks off, tool calls with their arguments, three sub-agents fanning out on a small graph, tokens and seconds counting up, and a short summary to finish. Stop it at any point or run it again. It is scripted and runs offline, so nothing is sent anywhere.",
  about: [
    "There is no model behind it. Each run is a prepared script, or a template filled in with what you type, compiled into a timeline of start and end times, and everything on the card is worked out from how far along that timeline the clock is. That keeps the pacing believable, makes Stop a simple freeze, and means a run plays out the same way every time.",
    "The planning line is a gradient clipped to the text, and the status above it rolls from one state to the next. Steps check off with a drawn tick on a small spring, and tool calls type in their arguments before they run; they open on a grid-row transition to show the JSON going in and the result coming out. On the graph, packets ride the Bézier edges from the lead to each sub-agent and on to the merge node, each one a bright head with a comet tail cut from the edge itself; a running sub-agent has a light sweeping round its border, and when the last result lands the merge node pulses and the edges flash once. The packets are moved every frame outside React, as are the timer and the odometer, whose digit columns roll forward a couple of times a second and come to rest in between, so the count can always be read.",
    "The transcript follows the run with an eased scroll and lets go as soon as you scroll or open something; a run you leave alone settles back on the graph when it is done. The ticks and the closing chime are synthesised in Web Audio and only play after you have touched the stage.",
  ],
  uses: ["React", "SVG", "CSS animations", "Web Audio"],
  category: "components",
  inspiredBy: "Run views in agent tools",
  // 204 × 252
  tile: { aspect: 204 / 252 },
  stage: { aspect: 0.68, minHeight: 500 },
  controlsHint: "Type a task and press Enter, or pick an example · Click a tool call to open it · Esc stops a run (in full screen, Esc leaves full screen instead)",
  sound: true,
};
