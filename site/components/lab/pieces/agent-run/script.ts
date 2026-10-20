// The runs. Nothing here talks to a model or the network: a run is a
// prepared script (or a template filled in with what you typed) compiled
// into a timeline of start / end times, and everything on screen is a pure
// function of how far along that timeline the clock is. Stopping freezes
// the clock; whatever was in flight is marked stopped.

export type Status = "pending" | "running" | "done" | "stopped";
export type Glyph = "circle" | "square" | "triangle" | "diamond";
export type ArgValue = string | number | boolean;

export type ToolSpec = {
  name: string;
  args: ReadonlyArray<readonly [string, ArgValue]>;
  result: readonly string[];
  /** Seconds the call takes once its arguments are written. */
  ms: number;
  tokens: number;
  /** Opens on its own while it runs (and folds away again after). */
  open?: boolean;
};

export type AgentSpec = {
  name: string;
  glyph: Glyph;
  /** The calls it makes, in order, with their durations. */
  tools: ReadonlyArray<readonly [string, number]>;
  result: string;
  tokens: number;
};

export type StepSpec = { label: string; tools?: readonly ToolSpec[]; agents?: readonly AgentSpec[] };

export type Script = {
  id: string;
  /** Example chip label. */
  chip?: string;
  task: string;
  /** A shorter task for the tile. */
  short?: string;
  steps: readonly StepSpec[];
  summary: { title: string; body: string; bullets: readonly string[] };
  /** Single line for the tile once it is done. */
  outcome: string;
};

/* ---------------------------------------------------------------------- */
/* prepared runs                                                           */
/* ---------------------------------------------------------------------- */

export const SCRIPTS: readonly Script[] = [
  {
    id: "audit",
    chip: "Audit a page for accessibility",
    task: "Audit the pricing page for accessibility",
    short: "Audit the pricing page",
    steps: [
      {
        label: "Load the page",
        tools: [
          {
            name: "fetch_page",
            args: [
              ["url", "/pricing"],
              ["viewport", 1280],
            ],
            result: ["200 OK · 38 kB", "412 nodes · 14 buttons · 9 images"],
            ms: 0.8,
            tokens: 1240,
            open: true,
          },
          {
            name: "read_dom",
            args: [
              ["selector", "main"],
              ["depth", 3],
            ],
            result: ["6 sections, 5 × <h2>", "no <h1> on the page"],
            ms: 0.6,
            tokens: 880,
          },
        ],
      },
      {
        label: "Check in parallel",
        agents: [
          { name: "Contrast", glyph: "circle", tools: [["sample_colors", 1.1], ["compare_ratios", 0.9]], result: "3 text pairs under 4.5:1", tokens: 2650 },
          { name: "Keyboard", glyph: "square", tools: [["tab_through", 1.3], ["trace_focus", 0.8]], result: "2 focus traps in the toggle", tokens: 2380 },
          { name: "Semantics", glyph: "triangle", tools: [["check_landmarks", 0.8], ["check_alt_text", 0.9]], result: "no h1, 4 images without alt", tokens: 1940 },
        ],
      },
      {
        label: "Draft the fixes",
        tools: [
          {
            name: "edit_file",
            args: [
              ["path", "app/pricing/page.tsx"],
              ["edits", 6],
            ],
            result: ["+18 −7 across 6 hunks"],
            ms: 1.0,
            tokens: 1760,
          },
        ],
      },
      {
        label: "Verify",
        tools: [
          {
            name: "run_checks",
            args: [
              ["suite", "a11y"],
              ["pages", 1],
            ],
            result: ["42 passed · 0 failed"],
            ms: 1.1,
            tokens: 620,
          },
        ],
      },
    ],
    summary: {
      title: "Ten issues on the pricing page, each with a drafted fix.",
      body: "The page loads cleanly, but it has no main heading, traps keyboard focus inside the billing toggle and sets three text pairs below the contrast minimum.",
      bullets: [
        "Three text pairs raised to at least 4.5:1",
        "Two focus traps freed in the monthly / yearly toggle",
        "A page heading added, and alt text for four images",
      ],
    },
    outcome: "10 issues, fixes drafted",
  },
  {
    id: "flaky",
    chip: "Fix a flaky test",
    task: "Find out why the checkout test is flaky, and fix it",
    short: "Fix the flaky checkout test",
    steps: [
      {
        label: "Reproduce the failure",
        tools: [
          {
            name: "run_tests",
            args: [
              ["file", "checkout.spec.ts"],
              ["repeat", 20],
            ],
            result: ["17 passed · 3 failed", "TimeoutError: waited 5000 ms for #confirm"],
            ms: 1.4,
            tokens: 1480,
            open: true,
          },
        ],
      },
      {
        label: "Investigate in parallel",
        agents: [
          { name: "Logs", glyph: "circle", tools: [["read_logs", 1.0], ["diff_runs", 1.1]], result: "mock answers in 4.8–5.3 s", tokens: 2210 },
          { name: "History", glyph: "square", tools: [["git_log", 0.8], ["blame", 0.9]], result: "began with the retry change", tokens: 1720 },
          { name: "Code", glyph: "diamond", tools: [["search_code", 0.7], ["read_file", 1.1]], result: "fixed sleep in helpers.ts:41", tokens: 2460 },
        ],
      },
      {
        label: "Patch the helper",
        tools: [
          {
            name: "edit_file",
            args: [
              ["path", "tests/helpers.ts"],
              ["line", 41],
            ],
            result: ["− await sleep(5000)", "+ await page.waitForResponse(isPayment)"],
            ms: 0.8,
            tokens: 940,
          },
        ],
      },
      {
        label: "Confirm the fix",
        tools: [
          {
            name: "run_tests",
            args: [
              ["file", "checkout.spec.ts"],
              ["repeat", 50],
            ],
            result: ["50 passed · 0 failed", "median 3.1 s, was 5.6 s"],
            ms: 1.6,
            tokens: 760,
          },
        ],
      },
    ],
    summary: {
      title: "The checkout test was racing a slow payment mock. It now waits for the response.",
      body: "A fixed five-second sleep sat right at the edge of the mock's response time, so about one run in seven timed out. Waiting for the response itself removes the race and makes the test faster.",
      bullets: ["50 of 50 runs pass after the change", "Median run down from 5.6 s to 3.1 s", "One line changed in tests/helpers.ts"],
    },
    outcome: "Race fixed, 50 of 50 pass",
  },
  {
    id: "triage",
    chip: "Triage this week's issues",
    task: "Triage this week's open issues and write a digest",
    short: "Triage this week's issues",
    steps: [
      {
        label: "Collect the issues",
        tools: [
          {
            name: "list_issues",
            args: [
              ["state", "open"],
              ["since", "7d"],
            ],
            result: ["23 issues · 41 comments", "oldest opened 6 days ago"],
            ms: 0.9,
            tokens: 1860,
            open: true,
          },
        ],
      },
      {
        label: "Sort in parallel",
        agents: [
          { name: "Bugs", glyph: "circle", tools: [["label_issues", 1.1], ["rank_severity", 0.9]], result: "9 bugs, 2 of them urgent", tokens: 2320 },
          { name: "Requests", glyph: "square", tools: [["cluster_topics", 1.3], ["link_related", 0.6]], result: "8 requests in 3 themes", tokens: 2040 },
          { name: "Duplicates", glyph: "triangle", tools: [["find_similar", 1.0], ["check_stale", 0.8]], result: "4 duplicates, 2 gone stale", tokens: 1580 },
        ],
      },
      {
        label: "Write the digest",
        tools: [
          {
            name: "write_doc",
            args: [
              ["title", "Weekly triage"],
              ["sections", 4],
            ],
            result: ["1 page · 23 links", "saved to docs/triage.md"],
            ms: 1.1,
            tokens: 1420,
          },
        ],
      },
    ],
    summary: {
      title: "23 open issues sorted. Two urgent bugs need an owner today.",
      body: "Most of the week's traffic is about sign-in and exports. Four issues repeat earlier reports and two have gone quiet, so they can be closed with a pointer.",
      bullets: ["9 bugs ranked by severity, 2 marked urgent", "8 feature requests grouped into 3 themes", "4 duplicates linked, 2 stale issues flagged"],
    },
    outcome: "23 issues sorted, 2 urgent",
  },
  {
    id: "release",
    chip: "Draft release notes",
    task: "Draft the release notes for version 2.4",
    short: "Draft the 2.4 release notes",
    steps: [
      {
        label: "Gather the changes",
        tools: [
          {
            name: "git_log",
            args: [
              ["from", "v2.3.0"],
              ["to", "main"],
            ],
            result: ["64 commits · 18 pull requests", "7 contributors"],
            ms: 0.8,
            tokens: 1320,
            open: true,
          },
          {
            name: "read_pulls",
            args: [
              ["merged", true],
              ["count", 18],
            ],
            result: ["18 descriptions, 5 with screenshots"],
            ms: 0.9,
            tokens: 1680,
          },
        ],
      },
      {
        label: "Write the sections in parallel",
        agents: [
          { name: "Features", glyph: "circle", tools: [["summarise", 1.2], ["pick_highlights", 0.8]], result: "5 features, 2 headline", tokens: 2480 },
          { name: "Fixes", glyph: "square", tools: [["group_fixes", 1.0], ["dedupe", 0.7]], result: "11 fixes in 4 areas", tokens: 1860 },
          { name: "Upgrading", glyph: "diamond", tools: [["find_breaking", 0.9], ["write_steps", 1.1]], result: "1 breaking change", tokens: 1540 },
        ],
      },
      {
        label: "Assemble the notes",
        tools: [
          {
            name: "write_doc",
            args: [
              ["title", "v2.4 release notes"],
              ["sections", 3],
            ],
            result: ["612 words · 3 sections"],
            ms: 1.0,
            tokens: 1240,
          },
        ],
      },
    ],
    summary: {
      title: "The 2.4 notes are drafted: five features, eleven fixes and one breaking change.",
      body: "Faster exports and the new sharing panel lead. The one breaking change, a renamed config key, comes with a two-line upgrade step.",
      bullets: ["Features open with the two headline changes", "Fixes grouped by area so they scan quickly", "Upgrade notes cover the renamed config key"],
    },
    outcome: "Notes drafted, 612 words",
  },
];

/* ---------------------------------------------------------------------- */
/* your own task                                                           */
/* ---------------------------------------------------------------------- */

/** "A very long task to…" → at most `max` characters, cut at a word. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

const CODE_WORDS = /\b(build|implement|add|refactor|create|make|migrate|code|fix|bug|api|component|function|endpoint|feature|test|deploy|port|rewrite)\b/i;

function codeTemplate(task: string): Script {
  const topic = clip(task, 30);
  return {
    id: "code",
    task,
    steps: [
      {
        label: "Read the codebase",
        tools: [
          {
            name: "search_code",
            args: [["query", topic]],
            result: ["14 matches in 6 files"],
            ms: 0.8,
            tokens: 1380,
            open: true,
          },
          { name: "read_file", args: [["path", "src/index.ts"]], result: ["212 lines · 9 exports"], ms: 0.6, tokens: 1120 },
        ],
      },
      {
        label: "Work it in parallel",
        agents: [
          { name: "Implement", glyph: "circle", tools: [["plan_changes", 1.0], ["edit_files", 1.3]], result: "4 files changed", tokens: 2840 },
          { name: "Tests", glyph: "square", tools: [["write_tests", 1.2], ["run_tests", 0.9]], result: "9 new tests pass", tokens: 2110 },
          { name: "Review", glyph: "diamond", tools: [["read_diff", 0.9], ["check_style", 0.7]], result: "2 small notes, no blockers", tokens: 1460 },
        ],
      },
      {
        label: "Run the checks",
        tools: [
          {
            name: "run_checks",
            args: [["suite", "all"]],
            result: ["128 passed · 0 failed", "typecheck clean"],
            ms: 1.2,
            tokens: 680,
          },
        ],
      },
    ],
    summary: {
      title: `“${clip(task, 64)}”: the change is in and the checks pass.`,
      body: "Three sub-agents split the work: one made the change, one wrote tests around it and one read the diff. The review left two small notes and nothing blocking.",
      bullets: ["4 files changed, 9 tests added", "All 128 checks pass", "2 review notes left for you to look at"],
    },
    outcome: "Change in, 128 checks pass",
  };
}

function researchTemplate(task: string): Script {
  const topic = clip(task, 30);
  return {
    id: "research",
    task,
    steps: [
      {
        label: "Understand the task",
        tools: [
          {
            name: "search_notes",
            args: [["query", topic]],
            result: ["12 related notes", "3 earlier threads"],
            ms: 0.9,
            tokens: 1460,
            open: true,
          },
        ],
      },
      {
        label: "Work it in parallel",
        agents: [
          { name: "Research", glyph: "circle", tools: [["search", 1.2], ["read_sources", 1.0]], result: "6 sources worth keeping", tokens: 2760 },
          { name: "Options", glyph: "square", tools: [["list_options", 1.0], ["compare", 1.1]], result: "2 strong directions", tokens: 2180 },
          { name: "Risks", glyph: "triangle", tools: [["find_risks", 0.9], ["check_limits", 0.8]], result: "1 open question", tokens: 1520 },
        ],
      },
      {
        label: "Write it up",
        tools: [
          {
            name: "write_doc",
            args: [["title", topic]],
            result: ["1 page · 3 sections"],
            ms: 1.0,
            tokens: 1180,
          },
        ],
      },
    ],
    summary: {
      title: `A first pass on “${clip(task, 64)}” is ready.`,
      body: "The task was split into three threads that ran side by side: one gathered context, one laid out the options and one looked for what could go wrong. Their notes were merged into a single page.",
      bullets: ["Six sources kept, the rest set aside", "Two directions worth choosing between", "One open question to settle first"],
    },
    outcome: "First pass ready",
  };
}

/**
 * The run for a task: an example when it is one (its task, chip or short
 * form), otherwise a template filled in with your words, a code-shaped one
 * for tasks that sound like changing code and a research-shaped one for
 * the rest. Prepared runs are never stretched over other tasks, so the
 * details always fit what you asked.
 */
export function scriptFor(input: string): Script {
  const task = input.replace(/\s+/g, " ").trim();
  const key = task.toLowerCase().replace(/[.!?]+$/, "");
  const exact = SCRIPTS.find((script) =>
    [script.task, script.chip, script.short].some((text) => text?.toLowerCase().replace(/[.!?]+$/, "") === key),
  );
  if (exact) return exact;
  return CODE_WORDS.test(task) ? codeTemplate(task) : researchTemplate(task);
}

/* ---------------------------------------------------------------------- */
/* timeline                                                                */
/* ---------------------------------------------------------------------- */

export type TTool = {
  id: string;
  spec: ToolSpec;
  /** One-line args, `url: "/pricing", viewport: 1280`. */
  line: string;
  start: number;
  /** The arguments finish streaming in. */
  argsEnd: number;
  end: number;
};

export type TAgent = {
  id: string;
  spec: AgentSpec;
  /** The dispatch packet leaves the lead. */
  sent: number;
  start: number;
  end: number;
  /** The result reaches the merge node. */
  back: number;
  calls: ReadonlyArray<{ name: string; start: number; end: number }>;
};

export type TStep = {
  id: string;
  index: number;
  label: string;
  start: number;
  end: number;
  tools: readonly TTool[];
  agents: readonly TAgent[];
  /** Every result has arrived at the merge node. */
  merged: number;
};

export type Word = { text: string; at: number };

export type Timeline = {
  script: Script;
  task: string;
  planStart: number;
  planEnd: number;
  steps: readonly TStep[];
  summaryStart: number;
  title: readonly Word[];
  body: readonly Word[];
  bullets: ReadonlyArray<readonly Word[]>;
  end: number;
  segments: ReadonlyArray<{ start: number; end: number; tokens: number }>;
  totalTokens: number;
  toolCount: number;
  agentCount: number;
};

export function formatValue(value: ArgValue): string {
  return typeof value === "string" ? `"${value}"` : String(value);
}

export function argsLine(args: ToolSpec["args"]): string {
  return args.map(([key, value]) => `${key}: ${formatValue(value)}`).join(", ");
}

export type Pace = {
  /** Multiplies every duration. */
  scale: number;
  planning: number;
  /** Seconds per summary word. */
  word: number;
  /** Tile: only the first call of each step, fewer steps. */
  compact?: boolean;
};

export const STAGE_PACE: Pace = { scale: 1, planning: 1.7, word: 0.036 };
export const TILE_PACE: Pace = { scale: 0.62, planning: 0.9, word: 0, compact: true };

function compactSteps(steps: readonly StepSpec[]): StepSpec[] {
  const parallel = steps.findIndex((step) => step.agents?.length);
  const first = steps[0];
  const last = steps[steps.length - 1];
  const picked = [first, parallel > 0 ? steps[parallel] : undefined, last].filter(
    (step, index, list): step is StepSpec => Boolean(step) && list.indexOf(step) === index,
  );
  return picked.map((step) => (step.tools ? { ...step, tools: step.tools.slice(0, 1) } : step));
}

function words(text: string, from: number, per: number): Word[] {
  return text.split(" ").map((word, index) => ({ text: word, at: from + index * per }));
}

export function compile(script: Script, pace: Pace = STAGE_PACE): Timeline {
  const s = pace.scale;
  const segments: Array<{ start: number; end: number; tokens: number }> = [];
  const planStart = 0.5 * s;
  const planEnd = planStart + pace.planning;
  segments.push({ start: planStart, end: planEnd, tokens: 540 });
  let t = planEnd + 0.4 * s;
  let toolCount = 0;
  let agentCount = 0;
  const specs = pace.compact ? compactSteps(script.steps) : script.steps;

  const steps: TStep[] = specs.map((spec, index) => {
    const start = t;
    t += 0.32 * s;
    const tools: TTool[] = (spec.tools ?? []).map((tool, toolIndex) => {
      const line = argsLine(tool.args);
      const callStart = t;
      const argsEnd = callStart + Math.min(0.55, 0.12 + line.length * 0.011) * s;
      const end = argsEnd + tool.ms * s;
      segments.push({ start: callStart, end, tokens: tool.tokens });
      t = end + 0.22 * s;
      toolCount += 1;
      return { id: `${index}.${toolIndex}`, spec: tool, line, start: callStart, argsEnd, end };
    });
    let merged = t;
    const agents: TAgent[] = (spec.agents ?? []).map((agent, agentIndex) => {
      const sent = t + agentIndex * 0.2 * s;
      const agentStart = sent + 0.42 * s;
      let cursor = agentStart + 0.12 * s;
      const calls = agent.tools.map(([name, ms]) => {
        const call = { name, start: cursor, end: cursor + ms * s };
        cursor = call.end + 0.14 * s;
        toolCount += 1;
        return call;
      });
      const agentEnd = cursor;
      const back = agentEnd + 0.5 * s;
      merged = Math.max(merged, back);
      segments.push({ start: agentStart, end: agentEnd, tokens: agent.tokens });
      agentCount += 1;
      return { id: `${index}.a${agentIndex}`, spec: agent, sent, start: agentStart, end: agentEnd, back, calls };
    });
    if (agents.length) t = merged + 0.3 * s;
    const end = t;
    t += 0.36 * s;
    return { id: String(index), index, label: spec.label, start, end, tools, agents, merged };
  });

  const summaryStart = t;
  const per = pace.word;
  let cursor = summaryStart + 0.35 * s;
  const title = words(script.summary.title, cursor, per * 0.8);
  cursor += title.length * per * 0.8 + 0.25 * s;
  const body = words(script.summary.body, cursor, per);
  cursor += body.length * per + 0.2 * s;
  const bullets = script.summary.bullets.map((bullet) => {
    const list = words(bullet, cursor, per);
    cursor += list.length * per + 0.12 * s;
    return list;
  });
  const end = cursor + 0.25 * s;
  segments.push({ start: summaryStart, end: Math.max(summaryStart + 0.6, end - 0.25 * s), tokens: 420 });

  const totalTokens = segments.reduce((sum, segment) => sum + segment.tokens, 0);
  return {
    script,
    task: script.task,
    planStart,
    planEnd,
    steps,
    summaryStart,
    title,
    body,
    bullets,
    end,
    segments,
    totalTokens,
    toolCount,
    agentCount,
  };
}

/* ---------------------------------------------------------------------- */
/* reading the timeline                                                    */
/* ---------------------------------------------------------------------- */

/** Where an item [start, end) is at time t; `stopped` freezes what was in flight. */
export function statusAt(start: number, end: number, t: number, stopped: boolean): Status {
  if (t < start) return "pending";
  if (t < end) return stopped ? "stopped" : "running";
  return "done";
}

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Tokens used by time t (each segment spends its tokens with an ease). */
export function tokensAt(timeline: Timeline, t: number): number {
  let total = 0;
  for (const segment of timeline.segments) {
    if (t <= segment.start) continue;
    const span = Math.max(0.001, segment.end - segment.start);
    const k = Math.min(1, (t - segment.start) / span);
    total += segment.tokens * (k >= 1 ? 1 : 0.15 * k + 0.85 * easeInOut(k));
  }
  return Math.round(total);
}

/** How many calls have finished by t (for the stats line). */
export function callsDone(timeline: Timeline, t: number): number {
  let count = 0;
  for (const step of timeline.steps) {
    for (const tool of step.tools) if (t >= tool.end) count += 1;
    for (const agent of step.agents) for (const call of agent.calls) if (t >= call.end) count += 1;
  }
  return count;
}

/** The step that is running (or the last one started) at t. */
export function currentStep(timeline: Timeline, t: number): TStep | undefined {
  let found: TStep | undefined;
  for (const step of timeline.steps) if (t >= step.start) found = step;
  return found;
}

/** What an agent is doing at t: the call in flight, or its result. */
export function agentActivity(agent: TAgent, t: number): string {
  if (t < agent.start) return "queued";
  if (t >= agent.end) return agent.spec.result;
  for (const call of agent.calls) if (t < call.end) return call.name;
  return agent.calls[agent.calls.length - 1]?.name ?? "";
}

/** When step `index` is written into the plan (they drop in one by one while it plans). */
export function plannedAt(timeline: Timeline, index: number): number {
  const n = timeline.steps.length;
  const span = timeline.planEnd - timeline.planStart;
  return timeline.planStart + span * (0.22 + (0.62 * index) / Math.max(1, n - 1));
}

/** Whether an auto-opening call is open at t. */
export function autoOpen(tool: TTool, t: number): boolean {
  return Boolean(tool.spec.open) && t >= tool.start && t < tool.end + 1.5;
}

/**
 * A string that changes exactly when something on screen (other than the
 * counters and the packets, which are drawn every frame) changes.
 */
export function viewKey(timeline: Timeline, t: number, stopped: boolean): string {
  const parts: Array<string | number> = [
    stopped ? "s" : "r",
    t < timeline.planStart ? 0 : t < timeline.planEnd ? 1 : 2,
    timeline.steps.filter((step) => t >= plannedAt(timeline, step.index)).length,
  ];
  for (const step of timeline.steps) {
    parts.push(statusAt(step.start, step.end, t, stopped)[0]);
    for (const tool of step.tools) {
      const status = statusAt(tool.start, tool.end, t, stopped);
      parts.push(status[0]);
      if (status === "running" && t < tool.argsEnd) {
        parts.push(Math.floor(((t - tool.start) / (tool.argsEnd - tool.start)) * tool.line.length));
      }
      parts.push(autoOpen(tool, t) ? "o" : "c");
    }
    for (const agent of step.agents) {
      parts.push(t >= agent.sent ? 1 : 0, statusAt(agent.start, agent.end, t, stopped)[0], agentActivity(agent, t), t >= agent.back ? 1 : 0);
    }
    if (step.agents.length) parts.push(t >= step.merged ? "m" : "");
  }
  if (t >= timeline.summaryStart) {
    const count = (list: readonly Word[]) => list.filter((word) => t >= word.at).length;
    parts.push("S", count(timeline.title), count(timeline.body), ...timeline.bullets.map(count));
  }
  parts.push(t >= timeline.end ? "E" : "");
  return parts.join("|");
}

/** "4.2s", "1:04.2" */
export function formatSeconds(seconds: number): string {
  const s = Math.max(0, seconds);
  if (s < 60) return `${s.toFixed(1)}s`;
  const minutes = Math.floor(s / 60);
  return `${minutes}:${(s - minutes * 60).toFixed(1).padStart(4, "0")}`;
}

/** "14,203" */
export function formatTokens(tokens: number): string {
  return Math.round(tokens).toLocaleString("en-US");
}
