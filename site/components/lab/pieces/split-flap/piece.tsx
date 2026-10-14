"use client";

// Departures: a split-flap board.
//
// Look. An object on the paper stage, not a screen: a housing in cream
// enamel by day and indigo lacquer by night, a recessed bay of matte
// indigo flaps with sand letters, a Casablanca clock in its own little bay
// and a lamp at the end of every row. One light from above does all the
// shading (see engine.ts): falling fronts darken, landing backs catch a
// glint, the half underneath sits in the flap's shadow.
//
// Motion. Each cell turns its drum one flap at a time (about 15 a
// second), only forwards, so a change takes as many flaps as the letters
// are apart; a flap falls under gravity, hits the stop, bounces and
// settles. Cells start a few ms apart along the row and down the board, so
// every change ripples. The timetable moves up a line every fourteen seconds
// (the first departure leaves), the clock turns over on the minute.
//
// Touch. Type a message and it flips to it; shuffle for one of ours; press
// a flap to turn it, hold to riffle, drag along a row to ripple it by hand.
// The clack is synthesised (sound.ts) and only plays once you have touched
// the stage, through the lab's shared, mutable audio.
//
// Tile: two rows of eight on the niche's night ground, turning between
// "CASA / BLANCA" and a few departures; a hover moves it on. Reduced
// motion: still boards, changes land at once.

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Star } from "@/components/ornament";
import { casaTime } from "@/lib/clock";
import { ensureAudio } from "../../audio";
import { useElementSize, useFrame, useIsoLayoutEffect } from "../../hooks";
import { Reset, Shuffle } from "../../lab-icons";
import type { PieceProps } from "../../types";
import {
  IconButton,
  MuteButton,
  StageControls,
  StageHint,
  Stepper,
  TextInput,
  Tray,
  TrayButton,
  TrayDivider,
  TrayRow,
} from "../../ui";
import {
  CLOCK_DRUMS,
  MESSAGES,
  TILE_BOARDS,
  TILE_COLS,
  centred,
  flightRow,
  flightsFor,
  layoutMessage,
  normalize,
  type Flight,
  type Glyph,
  type Tone,
} from "./drum";
import { FlapEngine, STAGE_TIMING, TILE_TIMING, type Cell } from "./engine";
import { FlapGrid, ripple } from "./grid";
import { playLandings } from "./sound";
import { css } from "./styles";

export default function Piece(props: PieceProps) {
  return (
    <>
      <style href="lab-split-flap" precedence="default">
        {css}
      </style>
      {props.mode === "stage" ? <Stage {...props} /> : <Tile {...props} />}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* shared                                                                  */
/* ---------------------------------------------------------------------- */

/**
 * How far to move the letters (in em) so their cap height sits centred on
 * the hinge: CSS centres the font's whole ascent + descent in the line,
 * not the capitals.
 */
function measureGlyphOffset(): number {
  try {
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-instrument").trim();
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx || !family) return 0;
    ctx.font = `600 100px ${family}`;
    const metrics = ctx.measureText("H");
    const ascent = metrics.fontBoundingBoxAscent;
    const descent = metrics.fontBoundingBoxDescent;
    const cap = metrics.actualBoundingBoxAscent;
    if (!ascent || !cap) return 0;
    return Math.round(((cap - ascent + descent) / 2 / 100) * 1000) / 1000;
  } catch {
    return 0;
  }
}

/** data-moving on the board while any flap is turning (handy for styling and for tests). */
function markMoving(element: HTMLElement | null, moving: boolean) {
  if (!element || element.hasAttribute("data-moving") === moving) return;
  element.toggleAttribute("data-moving", moving);
}

function useGlyphOffset(): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let live = true;
    setOffset(measureGlyphOffset());
    document.fonts?.ready.then(() => live && setOffset(measureGlyphOffset())).catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return offset;
}

/* ---------------------------------------------------------------------- */
/* stage                                                                   */
/* ---------------------------------------------------------------------- */

/** Board width in cells for the room available. */
const colsFor = (width: number) => (width >= 960 ? 26 : width >= 740 ? 22 : width >= 520 ? 18 : 16);

type Message = { text: string; key: number };

/** The timetable rows: the flights that fit, starting `offset` departures in. */
function timetable(flights: readonly Flight[], offset: number, rows: number): Array<Flight | undefined> {
  return Array.from({ length: rows }, (_, row) =>
    flights.length && row < flights.length ? flights[(offset + row) % flights.length] : undefined,
  );
}

const SCREWS: CSSProperties[] = [
  { left: "calc(var(--u) * 0.2)", top: "calc(var(--u) * 0.2)", "--a": "28deg" } as CSSProperties,
  { right: "calc(var(--u) * 0.2)", top: "calc(var(--u) * 0.2)", "--a": "-52deg" } as CSSProperties,
  { left: "calc(var(--u) * 0.2)", bottom: "calc(var(--u) * 0.2)", "--a": "74deg" } as CSSProperties,
  { right: "calc(var(--u) * 0.2)", bottom: "calc(var(--u) * 0.2)", "--a": "12deg" } as CSSProperties,
];

function Stage({ active, reducedMotion, theme }: PieceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const housingRef = useRef<HTMLDivElement>(null);
  const gridHostRef = useRef<HTMLDivElement>(null);
  const clockHostRef = useRef<HTMLDivElement>(null);
  const [engine] = useState(() => new FlapEngine(STAGE_TIMING));
  const gridRef = useRef<FlapGrid | null>(null);
  const clockRef = useRef<Cell[]>([]);
  const rowsRef = useRef(0);
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [offset, setOffset] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const glyphOffset = useGlyphOffset();
  /** performance.now() of the last thing you did here (louder clacks right after). */
  const touched = useRef(-1e9);
  const shuffleAt = useRef(0);

  const wake = useFrame(active, (dt) => {
    const report = engine.step(dt);
    if (report.landings) {
      // Full voice right after you touch it; the timetable ticking over on its own is quieter.
      playLandings(report.landings, report.pan, performance.now() - touched.current < 6000 ? 1 : 0.35);
    }
    markMoving(boardRef.current, report.busy);
    return report.busy ? undefined : false;
  });

  // Build the rows and the clock once; they live outside React.
  useIsoLayoutEffect(() => {
    const host = gridHostRef.current;
    const clockHost = clockHostRef.current;
    if (!host || !clockHost) return;
    const grid = new FlapGrid(engine, host, true);
    gridRef.current = grid;
    const cells = CLOCK_DRUMS.map((drum) => engine.create(drum, { ch: "0", tone: "sand" }));
    cells.forEach((cell, index) => {
      cell.pan = 0.85;
      if (index === 2) {
        const colon = document.createElement("span");
        colon.className = "sf-colon";
        clockHost.appendChild(colon);
      }
      clockHost.appendChild(cell.el);
    });
    clockRef.current = cells;
    return () => {
      grid.destroy();
      cells.forEach((cell) => engine.release(cell));
      clockHost.replaceChildren();
      gridRef.current = null;
      clockRef.current = [];
    };
  }, [engine]);

  // Fit the board to the stage: measure it at a reference size, then scale.
  const relayout = useCallback(() => {
    const root = rootRef.current;
    const board = boardRef.current;
    const housing = housingRef.current;
    const grid = gridRef.current;
    if (!root || !board || !housing || !grid) return;
    const width = root.clientWidth;
    const height = root.clientHeight;
    if (!width || !height) return;
    const side = width < 520 ? 12 : 40;
    const nextCols = colsFor(width - side * 2);
    if (!rowsRef.current) {
      // As many rows as there are departures to show (four fit a phone), at most six.
      rowsRef.current = Math.max(3, Math.min(6, flightsFor(nextCols).length));
      setRows(rowsRef.current);
    }
    grid.resize(rowsRef.current, nextCols);
    setCols(nextCols);
    setNarrow(nextCols <= 16);

    // Where the trays start (they float at the bottom of the stage).
    const rootTop = root.getBoundingClientRect().top;
    let controlsTop = height;
    root.querySelectorAll<HTMLElement>(":scope > [data-lab-controls]").forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.height) controlsTop = Math.min(controlsTop, rect.top - rootTop);
    });
    const dome = parseFloat(getComputedStyle(root).getPropertyValue("--lab-dome")) || 0;

    board.style.setProperty("--u", "20px");
    const w20 = housing.offsetWidth;
    const h20 = housing.offsetHeight;
    const availW = width - side * 2;
    const reach = Math.min(0.98, availW / width);
    const top = dome * (1 - Math.sqrt(1 - reach * reach)) + (width < 520 ? 14 : 22);
    const availH = controlsTop - top - (width < 520 ? 14 : 22);
    const u = Math.max(8, Math.min(64, Math.floor(20 * Math.min(availW / w20, availH / h20) * 4) / 4));
    board.style.setProperty("--u", `${u}px`);
    const boardW = (w20 * u) / 20;
    const boardH = (h20 * u) / 20;
    board.style.left = `${Math.round((width - boardW) / 2)}px`;
    board.style.top = `${Math.round(top + Math.max(0, (availH - boardH) / 2))}px`;
    board.dataset.ready = "";
  }, []);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    relayout();
    const observer = new ResizeObserver(() => relayout());
    observer.observe(root);
    root.querySelectorAll(":scope > [data-lab-controls]").forEach((element) => observer.observe(element));
    document.fonts?.ready.then(() => relayout()).catch(() => {});
    return () => observer.disconnect();
  }, [relayout]);

  useIsoLayoutEffect(() => {
    if (!rows) return;
    rowsRef.current = rows;
    relayout();
  }, [rows, relayout]);

  // What the board shows: your message, or the timetable.
  const flights = useMemo(() => (cols ? flightsFor(cols) : []), [cols]);
  const shown = useMemo(() => timetable(flights, offset, rows), [flights, offset, rows]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !cols || !rows || grid.cols !== cols || grid.rows !== rows) return;
    if (message) {
      grid.show(layoutMessage(message.text, rows, cols), { instant: reducedMotion, stagger: ripple(Math.random, 0.022, 0.06) });
      grid.setLamps([]);
    } else {
      grid.show(
        shown.map((flight) => flightRow(flight, cols)),
        { instant: reducedMotion },
      );
      grid.setLamps(
        shown.map((flight) => flight?.tone ?? null),
        reducedMotion ? undefined : (row) => 0.9 + row * 0.07,
      );
    }
    wake();
  }, [cols, rows, message, shown, reducedMotion, wake]);

  // The clock, once a second; the timetable moves up every ten.
  useEffect(() => {
    if (!active) return;
    let ticks = 0;
    const tick = () => {
      const now = casaTime(Math.floor(Date.now() / 1000));
      if (!now) return;
      const digits = now.hh + now.mm;
      clockRef.current.forEach((cell, index) => {
        const glyph: Glyph = { ch: digits[index], tone: "sand" };
        if (cell.target.ch === glyph.ch) return;
        if (reducedMotion) engine.place(cell, glyph);
        else engine.set(cell, glyph, 0.35 + index * 0.06);
      });
      setTime(`${now.hh}:${now.mm}`);
      wake();
      ticks += 1;
      if (!reducedMotion && !message && ticks % 14 === 0) setOffset((value) => value + 1);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [active, reducedMotion, message, engine, wake]);

  const touch = () => {
    ensureAudio();
    touched.current = performance.now();
  };

  const submit = (value: string) => {
    touch();
    const text = normalize(value).replace(/\s+/g, " ").trim();
    if (!text) {
      setMessage(null);
      setAnnounce("Back to the departures.");
      return;
    }
    setMessage({ text, key: performance.now() });
    setAnnounce(`The board turns to: ${text.toLowerCase()}`);
  };

  const shuffle = () => {
    const next = MESSAGES[shuffleAt.current % MESSAGES.length];
    shuffleAt.current += 1;
    setDraft(next);
    submit(next);
  };

  const backToDepartures = () => {
    touch();
    setDraft("");
    setMessage(null);
    setAnnounce("Back to the departures.");
  };

  // Press a flap to turn it, hold to riffle, drag along to ripple. With
  // reduced motion a press steps the flap at once (the clack stays).
  const drag = useRef<{ id: number; cell: Cell; timer: number } | null>(null);
  const turn = (cell: Cell) => {
    if (!reducedMotion) {
      engine.nudge(cell);
      return;
    }
    const target = cell.target;
    engine.place(cell, { ch: cell.next(target.ch), tone: target.tone });
    playLandings(1, cell.pan);
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    window.clearTimeout(current.timer);
    engine.spin(current.cell, false);
    drag.current = null;
  };
  const boardHandlers = {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (event.button > 0 || drag.current) return;
      const cell = gridRef.current?.cellAt(event.target as Element);
      if (!cell) return;
      touch();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
      turn(cell);
      const timer = reducedMotion
        ? 0
        : window.setTimeout(() => {
            engine.spin(cell, true);
            wake();
          }, 340);
      drag.current = { id: event.pointerId, cell, timer };
      wake();
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      const current = drag.current;
      if (!current || current.id !== event.pointerId) return;
      const cell = gridRef.current?.cellAt(document.elementFromPoint(event.clientX, event.clientY));
      if (!cell || cell === current.cell) return;
      window.clearTimeout(current.timer);
      engine.spin(current.cell, false);
      turn(cell);
      current.cell = cell;
      touched.current = performance.now();
      wake();
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: endDrag,
  };

  useEffect(
    () => () => {
      if (drag.current) window.clearTimeout(drag.current.timer);
    },
    [],
  );

  const capacity = Math.max(16, (rows || 6) * (cols || 26));
  const description = message
    ? `A split-flap departures board. It reads: ${message.text.toLowerCase()}.`
    : `A split-flap departures board.${time ? ` ${time} in Casablanca.` : ""} ${shown
        .filter((flight): flight is Flight => Boolean(flight))
        .map((flight) => `${flight.name.toLowerCase()}, ${flight.remark.toLowerCase()}`)
        .join("; ")}.`;

  const wide = cols >= 18;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden"
      onPointerDownCapture={() => ensureAudio()}
      onKeyDownCapture={() => ensureAudio()}
    >
      <div
        ref={boardRef}
        aria-hidden="true"
        className="sf sf-board"
        data-narrow={narrow ? "" : undefined}
        style={{ "--oy": `${glyphOffset}em` } as CSSProperties}
      >
        <div ref={housingRef} className="sf-housing" data-theme={theme}>
          {SCREWS.map((style, index) => (
            <span key={index} className="sf-screw" style={style} />
          ))}
          <div className="sf-head">
            <div className="sf-title">
              <Star variant="inlaid" />
              <span className="sf-departs">Départs</span>
              {wide ? <span className="sf-caps">Departures</span> : null}
            </div>
            <div className="sf-clock">
              <div className="sf-place">
                {wide ? (
                  <span className="sf-arabic" lang="ar" dir="rtl">
                    الدار البيضاء
                  </span>
                ) : null}
                <span className="sf-caps">Casablanca</span>
              </div>
              <div ref={clockHostRef} className="sf-bay sf-clockbay" />
            </div>
          </div>
          <div className="sf-cols" data-off={message ? "" : undefined}>
            <span className="sf-caps">Destination</span>
            <span className="sf-caps">Remarks</span>
          </div>
          <div className="sf-bay">
            <div ref={gridHostRef} className="sf-grid" data-touch="" style={{ touchAction: "pan-y" }} {...boardHandlers} />
          </div>
        </div>
      </div>

      <div className="sr-only">{description}</div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <StageControls placement="bottom">
        <TrayRow>
          <Tray label="Message">
            <TextInput
              label="Message for the board"
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              placeholder="Write to the board"
              maxLength={capacity}
              submitLabel="Flip"
              width={narrow ? 168 : 228}
            />
            <IconButton label="Shuffle a message" onClick={shuffle}>
              <Shuffle size={16} />
            </IconButton>
          </Tray>
          <Tray label="Board">
            <Stepper label="Rows" value={rows || 6} min={2} max={narrow ? 7 : 8} onChange={setRows} />
            <TrayDivider />
            {message ? (
              <TrayButton icon={<Reset size={14} />} onClick={backToDepartures}>
                Departures
              </TrayButton>
            ) : null}
            <MuteButton />
          </Tray>
        </TrayRow>
        <StageHint className="max-sm:hidden">Press a flap to turn it, hold to riffle, drag along a row</StageHint>
      </StageControls>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* tile                                                                    */
/* ---------------------------------------------------------------------- */

function Tile({ active, reducedMotion }: PieceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridHostRef = useRef<HTMLDivElement>(null);
  const lampRef = useRef<HTMLSpanElement>(null);
  const [engine] = useState(() => new FlapEngine(TILE_TIMING));
  const gridRef = useRef<FlapGrid | null>(null);
  const size = useElementSize(rootRef);
  const [index, setIndex] = useState(0);
  const changedAt = useRef(0);
  const glyphOffset = useGlyphOffset();
  const wake = useFrame(active, (dt) => {
    const { busy } = engine.step(dt);
    markMoving(rootRef.current, busy);
    return busy ? undefined : false;
  });

  useIsoLayoutEffect(() => {
    const host = gridHostRef.current;
    if (!host) return;
    const grid = new FlapGrid(engine, host, false);
    grid.resize(2, TILE_COLS);
    gridRef.current = grid;
    return () => {
      grid.destroy();
      gridRef.current = null;
    };
  }, [engine]);

  useIsoLayoutEffect(() => {
    const board = rootRef.current;
    if (!board || !size.width) return;
    // The arch window is the middle 72% of the box (x 14…86 of 100). Eight
    // cells and seven gaps (8.84 cells) fill about 68% of the box, with the
    // window's night ground as their bay.
    const u = Math.max(6, Math.min((size.width * 0.68) / 8.84, (size.height * 0.42) / 5));
    board.style.setProperty("--u", `${Math.round(u * 4) / 4}px`);
  }, [size.width, size.height]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const board = TILE_BOARDS[index % TILE_BOARDS.length];
    const lines: Glyph[][] = [centred(board.rows[0], TILE_COLS, "sand"), centred(board.rows[1], TILE_COLS, board.tone)];
    const first = grid.fresh;
    grid.show(lines, { instant: first || reducedMotion, stagger: ripple(Math.random, 0.03, 0.11) });
    changedAt.current = performance.now();
    const lamp = lampRef.current;
    const tone: Tone | null = board.lamp;
    const light = () => {
      if (!lamp) return;
      if (tone === "green" || tone === "ochre") lamp.dataset.tone = tone;
      else delete lamp.dataset.tone;
    };
    if (first || reducedMotion) {
      light();
      return;
    }
    wake();
    const timer = window.setTimeout(light, 1100);
    return () => window.clearTimeout(timer);
  }, [index, reducedMotion, wake]);

  useEffect(() => {
    if (!active || reducedMotion) return;
    const timer = window.setTimeout(() => setIndex((value) => value + 1), index === 0 ? 2400 : 4200);
    return () => window.clearTimeout(timer);
  }, [active, reducedMotion, index]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="sf sf-tile"
      style={{ "--oy": `${glyphOffset}em` } as CSSProperties}
      onPointerEnter={() => {
        if (!active || reducedMotion || performance.now() - changedAt.current < 1600) return;
        setIndex((value) => value + 1);
      }}
    >
      <div className="sf-tile-board">
        <span className="sf-caps">Departures</span>
        <div ref={gridHostRef} className="sf-grid" />
        <div className="sf-tile-foot">
          <span ref={lampRef} className="sf-lamp" />
          <i />
        </div>
      </div>
    </div>
  );
}
