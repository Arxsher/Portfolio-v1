"use client";

// Departures: a split-flap board.
//
// Look. An object on the stage, not a screen: a housing in satin white
// enamel (graphite in dark mode) held by four steel screws, a recessed bay
// of charcoal flaps with white letters in Geist, Zakaria's local time in
// its own little bay (labelled with the day and the GMT offset, read from
// the browser's time-zone data) and a lamp at the end of every row. One light from above
// does all the shading (see engine.ts): falling fronts darken, landing
// backs catch a glint, the half underneath sits in the flap's shadow.
// Colour is kept for meaning: remarks and lamps in the site's green and
// amber; everything else is neutral, like the site.
//
// Motion. Each cell turns its drum one flap at a time (about 15 a
// second), only forwards, so a change takes as many flaps as the letters
// are apart; a flap falls under gravity, hits the stop, bounces and
// settles. Cells start a few ms apart along the row and down the board, so
// every change ripples. The timetable moves up a line every fourteen
// seconds (the first departure leaves) unless you have just been turning
// flaps; the clock turns over on the minute.
//
// Touch. Type a message and it flips to it; shuffle for one of ours; press
// a flap to turn it, hold to riffle, drag along a row to ripple it by hand.
// The bay is also one focusable board for the keyboard: arrows choose a
// flap (a ring marks it), Space or Enter turns it (hold to riffle),
// letters and figures set it and move on, Backspace clears, Escape goes
// back to the departures. The clack is synthesised (sound.ts) and only
// plays once you have touched the stage, through the lab's shared, mutable
// audio.
//
// Layout. The board is measured at --u: 20px (one cell's width) and scaled
// to fit above the trays with room at the sides. Its scale never grows past
// what the opening row count allows, so taking rows away only re-centres it
// (it slides); adding rows past that shrinks it to fit.
//
// Tile: the same object in miniature on the tile's own ground: the housing,
// two rows of eight turning between "WELCOME / ABOARD" and a few departures,
// the legend and one lamp lit for the remark; a hover moves it on. Reduced
// motion: still boards, changes land at once.

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Logo } from "@/components/logo";
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
import { localTime } from "./clock";
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
 * not the capitals. Measured on the font the page actually uses (Geist's
 * capitals are already centred, so this is ~0 there; a fallback font may
 * need a nudge).
 */
function measureGlyphOffset(): number {
  try {
    const family = getComputedStyle(document.body).fontFamily;
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

/** data-moving on the board while any flap is turning (handy for styling and for tests). */
function markMoving(element: HTMLElement | null, moving: boolean) {
  if (!element || element.hasAttribute("data-moving") === moving) return;
  element.toggleAttribute("data-moving", moving);
}

/** A row lamp: green steady, amber breathing, or out. */
function lightLamp(lamp: HTMLElement | null, tone: Tone | null) {
  if (!lamp) return;
  if (tone === "green" || tone === "amber") lamp.dataset.tone = tone;
  else delete lamp.dataset.tone;
}

/** The four slotted screws, each turned its own way. */
const SCREWS = [
  { at: "tl", angle: "28deg" },
  { at: "tr", angle: "-52deg" },
  { at: "bl", angle: "74deg" },
  { at: "br", angle: "12deg" },
] as const;

function Screws() {
  return (
    <>
      {SCREWS.map(({ at, angle }) => (
        <span key={at} aria-hidden="true" className="sf-screw" data-p={at} style={{ "--a": angle } as CSSProperties} />
      ))}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* stage                                                                   */
/* ---------------------------------------------------------------------- */

/** Board width in cells for the room available. */
const colsFor = (width: number) =>
  width >= 1240 ? 30 : width >= 960 ? 26 : width >= 740 ? 22 : width >= 520 ? 18 : 16;

/** Height of one more row, in cells: a flap (1.44) and the gap under it (0.2). See styles.ts. */
const ROW_PITCH = 1.64;

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

type Message = { text: string; key: number };

/** The timetable rows: the flights that fit, starting `offset` departures in. */
function timetable(flights: readonly Flight[], offset: number, rows: number): Array<Flight | undefined> {
  return Array.from({ length: rows }, (_, row) =>
    flights.length && row < flights.length ? flights[(offset + row) % flights.length] : undefined,
  );
}

const describeCell = (row: number, col: number, cell: Cell) =>
  `Row ${row + 1}, column ${col + 1}: ${cell.target.ch === " " ? "blank" : cell.target.ch}`;

function Stage({ active, reducedMotion, theme }: PieceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const housingRef = useRef<HTMLDivElement>(null);
  const bayRef = useRef<HTMLDivElement>(null);
  const gridHostRef = useRef<HTMLDivElement>(null);
  const clockHostRef = useRef<HTMLDivElement>(null);
  const [engine] = useState(() => new FlapEngine(STAGE_TIMING));
  const gridRef = useRef<FlapGrid | null>(null);
  const clockRef = useRef<Cell[]>([]);
  const rowsRef = useRef(0);
  /** The scale of the last layout: a re-centre may only slide when it is unchanged. */
  const lastU = useRef(0);
  /** The largest scale the opening rows allow, kept per stage size so a row change never nudges it. */
  const capRef = useRef({ key: "", u: 0 });
  const cursor = useRef({ row: 0, col: 0 });
  const cursorEl = useRef<HTMLElement | null>(null);
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [offset, setOffset] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  /** The legend beside the clock: the zone ("GMT+1") and the day ("Tue 20 Oct"). */
  const [zone, setZone] = useState("");
  const [day, setDay] = useState("");
  const [announce, setAnnounce] = useState("");
  const glyphOffset = useGlyphOffset();
  const id = useId();
  /** performance.now() of the last thing you did here (louder clacks right after; the timetable waits). */
  const touched = useRef(-1e9);
  const shuffleAt = useRef(0);

  const wake = useFrame(active, (dt) => {
    const report = engine.step(dt);
    if (report.landings) {
      // Full voice right after you touch it; the timetable ticking over on its own is quieter.
      playLandings(report.landings, report.pan, performance.now() - touched.current < 6000 ? 1 : 0.35);
    }
    gridRef.current?.updateLamps();
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
    const cells = CLOCK_DRUMS.map((drum) => engine.create(drum, { ch: "0", tone: "ink" }));
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
      cursorEl.current = null;
    };
  }, [engine]);

  /** Marks the keyboard's flap (clamped to the board) and returns it. */
  const placeCursor = useCallback((): Cell | null => {
    const grid = gridRef.current;
    if (!grid || !grid.rows || !grid.cols) return null;
    const at = cursor.current;
    at.row = Math.max(0, Math.min(grid.rows - 1, at.row));
    at.col = Math.max(0, Math.min(grid.cols - 1, at.col));
    const cell = grid.cells[at.row][at.col];
    if (cursorEl.current !== cell.el) {
      cursorEl.current?.removeAttribute("data-cursor");
      cell.el.setAttribute("data-cursor", "");
      cursorEl.current = cell.el;
    }
    return cell;
  }, []);

  // Fit the board to the stage: measure it at a reference size, then scale.
  const relayout = useCallback(
    (slide = false) => {
      const root = rootRef.current;
      const board = boardRef.current;
      const housing = housingRef.current;
      const grid = gridRef.current;
      if (!root || !board || !housing || !grid) return;
      const width = root.clientWidth;
      const height = root.clientHeight;
      if (!width || !height) return;
      const phone = width < 520;
      // Room at the sides: a fixed margin on small stages, a share of the width on big ones (full screen).
      const side = phone ? 12 : Math.max(40, Math.round(width * 0.06));
      const availW = width - side * 2;
      const nextCols = colsFor(availW);
      // The opening row count: as many as there are departures to show (four fit a phone), at most six.
      const openingRows = Math.max(3, Math.min(6, flightsFor(nextCols).length));
      if (!rowsRef.current) {
        rowsRef.current = openingRows;
        setRows(openingRows);
      }
      const rowCount = rowsRef.current;
      grid.resize(rowCount, nextCols);
      placeCursor();
      setCols(nextCols);
      setNarrow(nextCols <= 16);

      // Where the trays start (they float at the bottom of the stage).
      const rootTop = root.getBoundingClientRect().top;
      let controlsTop = height;
      root.querySelectorAll<HTMLElement>(":scope > [data-lab-controls]").forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.height) controlsTop = Math.min(controlsTop, rect.top - rootTop);
      });

      board.style.setProperty("--u", "20px");
      const box = housing.getBoundingClientRect();
      const w20 = box.width;
      const h20 = box.height;
      const pad = phone ? 14 : 22;
      const availH = controlsTop - pad * 2;
      const fit = (h: number) => 20 * Math.min(availW / w20, availH / h);
      // Never larger than the opening rows allow, so fewer rows re-centre the board instead of zooming it.
      const key = `${width}:${height}:${Math.round(controlsTop)}:${nextCols}`;
      if (capRef.current.key !== key) {
        capRef.current = { key, u: fit(h20 + (openingRows - rowCount) * ROW_PITCH * 20) };
      }
      const u = Math.max(8, Math.min(64, Math.floor(Math.min(fit(h20), capRef.current.u) * 4) / 4));
      board.style.setProperty("--u", `${u}px`);
      const boardW = (w20 * u) / 20;
      const boardH = (h20 * u) / 20;
      // A row added or taken away slides the board to its new centre; anything that rescales it jumps.
      board.style.transition = slide && u === lastU.current ? `top 300ms ${EASE_OUT}` : "none";
      lastU.current = u;
      board.style.left = `${Math.round((width - boardW) / 2)}px`;
      board.style.top = `${Math.round(pad + Math.max(0, (availH - boardH) / 2))}px`;
      board.dataset.ready = "";
    },
    [placeCursor],
  );

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
    const changed = rowsRef.current !== 0 && rowsRef.current !== rows;
    rowsRef.current = rows;
    relayout(changed);
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
      grid.setLamps(shown.map((flight) => flight?.tone ?? null));
    }
    wake();
  }, [cols, rows, message, shown, reducedMotion, wake]);

  // The clock, once a second; the timetable moves up every fourteen idle seconds.
  useEffect(() => {
    if (!active) return;
    let idle = 0;
    const tick = () => {
      const now = localTime(Math.floor(Date.now() / 1000));
      if (!now) return;
      const digits = now.hh + now.mm;
      clockRef.current.forEach((cell, index) => {
        const glyph: Glyph = { ch: digits[index], tone: "ink" };
        if (cell.target.ch === glyph.ch) return;
        if (reducedMotion) engine.place(cell, glyph);
        else engine.set(cell, glyph, 0.35 + index * 0.06);
      });
      setTime(`${now.hh}:${now.mm}`);
      setZone(now.zone);
      setDay(now.day);
      wake();
      // While you are turning flaps by hand the timetable holds still.
      if (performance.now() - touched.current > 8000) idle += 1;
      if (!reducedMotion && !message && idle >= 14) {
        idle = 0;
        setOffset((value) => value + 1);
      }
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

  // One more flap. With reduced motion it steps at once (the clack stays).
  const turn = (cell: Cell) => {
    if (!reducedMotion) {
      engine.nudge(cell);
      return;
    }
    const target = cell.target;
    engine.place(cell, { ch: cell.next(target.ch), tone: target.tone });
    playLandings(1, cell.pan);
  };

  /** Turns a flap round the drum to `ch` (typed on the board). */
  const setCell = (cell: Cell, ch: string) => {
    touch();
    const glyph: Glyph = { ch, tone: "ink" };
    if (!reducedMotion) engine.set(cell, glyph);
    else if (cell.target.ch !== ch || cell.target.tone !== "ink") {
      engine.place(cell, glyph);
      playLandings(1, cell.pan);
    }
    wake();
  };

  // Pointer: press a flap to turn it, hold to riffle, drag along to ripple.
  const drag = useRef<{ id: number; cell: Cell; timer: number } | null>(null);
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
      const grid = gridRef.current;
      const cell = grid?.cellAt(event.target as Element);
      if (!grid || !cell) return;
      touch();
      bayRef.current?.removeAttribute("data-kbd");
      const at = grid.positionOf(cell);
      if (at) {
        cursor.current = at;
        placeCursor();
      }
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

  // Keyboard: the bay is one focusable board with a cursor flap.
  const keyHold = useRef<{ cell: Cell; timer: number } | null>(null);
  const releaseKey = () => {
    const held = keyHold.current;
    if (!held) return;
    window.clearTimeout(held.timer);
    engine.spin(held.cell, false);
    keyHold.current = null;
    wake();
    const at = gridRef.current?.positionOf(held.cell);
    if (at) setAnnounce(describeCell(at.row, at.col, held.cell));
  };

  const onBoardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
    const grid = gridRef.current;
    if (!grid || !grid.rows || !grid.cols) return;
    const at = cursor.current;
    const go = (row: number, col: number) => {
      at.row = row;
      at.col = col;
      const cell = placeCursor();
      if (cell) setAnnounce(describeCell(at.row, at.col, cell));
    };
    const key = event.key;
    switch (key) {
      case "ArrowLeft":
        go(at.row, at.col - 1);
        break;
      case "ArrowRight":
        go(at.row, at.col + 1);
        break;
      case "ArrowUp":
        go(at.row - 1, at.col);
        break;
      case "ArrowDown":
        go(at.row + 1, at.col);
        break;
      case "Home":
        go(at.row, 0);
        break;
      case "End":
        go(at.row, grid.cols - 1);
        break;
      case " ":
      case "Enter": {
        if (event.repeat || keyHold.current) break;
        const cell = placeCursor();
        if (!cell) break;
        touch();
        turn(cell);
        const timer = reducedMotion
          ? 0
          : window.setTimeout(() => {
              engine.spin(cell, true);
              wake();
            }, 340);
        keyHold.current = { cell, timer };
        wake();
        break;
      }
      case "Escape":
        if (!message) return;
        backToDepartures();
        break;
      case "Backspace": {
        if (at.col > 0) at.col -= 1;
        else if (at.row > 0) {
          at.row -= 1;
          at.col = grid.cols - 1;
        }
        const cell = placeCursor();
        if (cell) setCell(cell, " ");
        break;
      }
      case "Delete": {
        const cell = placeCursor();
        if (cell) setCell(cell, " ");
        break;
      }
      default: {
        if (key.length !== 1) return;
        const ch = normalize(key);
        const cell = ch.trim() ? placeCursor() : null;
        if (!cell) return;
        setCell(cell, ch);
        // and on to the next flap, like typing
        if (at.col < grid.cols - 1) at.col += 1;
        else if (at.row < grid.rows - 1) {
          at.row += 1;
          at.col = 0;
        }
        placeCursor();
      }
    }
    // Shows the ring from now on (also after a click put focus here).
    event.currentTarget.setAttribute("data-kbd", "");
    event.preventDefault();
  };

  const onBoardKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " " || event.key === "Enter") releaseKey();
  };

  useEffect(
    () => () => {
      if (drag.current) window.clearTimeout(drag.current.timer);
      if (keyHold.current) window.clearTimeout(keyHold.current.timer);
    },
    [],
  );

  const capacity = Math.max(16, (rows || 6) * (cols || 26));
  const description = message
    ? `It reads: ${message.text.toLowerCase()}.`
    : `${time ? `Local time ${time}${zone ? ` ${zone}` : ""}. ` : ""}${shown
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
        className="sf sf-board"
        data-narrow={narrow ? "" : undefined}
        style={{ "--oy": `${glyphOffset}em` } as CSSProperties}
      >
        <div ref={housingRef} className="sf-housing" data-theme={theme}>
          <Screws />
          <div className="sf-head" aria-hidden="true">
            <div className="sf-title">
              <Logo size={14} />
              <span className="sf-departs">Departures</span>
              {wide && day ? <span className="sf-caps">{day}</span> : null}
            </div>
            <div className="sf-clock">
              <div className="sf-place">
                {zone ? <span className="sf-zone">{zone}</span> : null}
                <span className="sf-caps">Local time</span>
              </div>
              <div ref={clockHostRef} className="sf-bay sf-clockbay" />
            </div>
          </div>
          <div className="sf-cols" aria-hidden="true" data-off={message ? "" : undefined}>
            <span className="sf-caps">Destination</span>
            <span className="sf-caps">Remarks</span>
          </div>
          <div
            ref={bayRef}
            className="sf-bay"
            tabIndex={0}
            role="application"
            aria-roledescription="split-flap board"
            aria-label="Departures board"
            aria-describedby={`${id}-board ${id}-keys`}
            onKeyDown={onBoardKeyDown}
            onKeyUp={onBoardKeyUp}
            onBlur={releaseKey}
          >
            <div
              ref={gridHostRef}
              aria-hidden="true"
              className="sf-grid"
              data-touch=""
              style={{ touchAction: "pan-y" }}
              {...boardHandlers}
            />
          </div>
        </div>
      </div>

      <p id={`${id}-board`} className="sr-only">
        {description}
      </p>
      <p id={`${id}-keys`} className="sr-only">
        Arrow keys choose a flap. Space or Enter turns it; hold to keep it turning. Type a letter or figure to set the
        flap and move on, Backspace to clear one{message ? ", Escape to go back to the departures" : ""}.
      </p>
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

/** How long a tile board holds once its last flap has landed, before it turns over. */
const TILE_HOLD = 2600;

function Tile({ active, reducedMotion, theme }: PieceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const gridHostRef = useRef<HTMLDivElement>(null);
  const lampRef = useRef<HTMLSpanElement>(null);
  const [engine] = useState(() => new FlapEngine(TILE_TIMING));
  const gridRef = useRef<FlapGrid | null>(null);
  const size = useElementSize(rootRef);
  // The still frame (reduced motion) is a departure with its lamp lit, not the greeting.
  const [index, setIndex] = useState(() => (reducedMotion ? 1 : 0));
  const changedAt = useRef(0);
  /** The lamp's tone for the board turning in, lit once its last flap lands. */
  const pendingLamp = useRef<Tone | null | undefined>(undefined);
  /** The timer that turns the board over once it has been readable for a while. */
  const holdTimer = useRef(0);
  const holdThenTurn = useCallback(() => {
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => setIndex((value) => value + 1), TILE_HOLD);
  }, []);
  const glyphOffset = useGlyphOffset();
  const wake = useFrame(active, (dt) => {
    const { busy } = engine.step(dt);
    if (!busy && pendingLamp.current !== undefined) {
      lightLamp(lampRef.current, pendingLamp.current);
      pendingLamp.current = undefined;
      // The hold starts when the last flap lands, not when the change began,
      // so every board reads for a moment however slow the frames are.
      holdThenTurn();
    }
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

  // Measure the miniature at --u: 20px, then scale it to span about 78% of
  // the tile's width (and never more than 62% of its height).
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    const mini = miniRef.current;
    if (!root || !mini || !size.width || !size.height) return;
    root.style.setProperty("--u", "20px");
    const w20 = mini.offsetWidth;
    const h20 = mini.offsetHeight;
    if (!w20 || !h20) return;
    const u = Math.max(5, 20 * Math.min((size.width * 0.78) / w20, (size.height * 0.62) / h20));
    root.style.setProperty("--u", `${Math.round(u * 4) / 4}px`);
  }, [size.width, size.height]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    // A new board is on its way (a hover can bring it early): its own landing starts the next hold.
    window.clearTimeout(holdTimer.current);
    const board = TILE_BOARDS[index % TILE_BOARDS.length];
    const lines: Glyph[][] = [centred(board.rows[0], TILE_COLS, "ink"), centred(board.rows[1], TILE_COLS, board.tone)];
    const first = grid.fresh;
    grid.show(lines, { instant: first || reducedMotion, stagger: ripple(Math.random, 0.03, 0.11) });
    changedAt.current = performance.now();
    if (first || reducedMotion) {
      pendingLamp.current = undefined;
      lightLamp(lampRef.current, board.lamp);
      return;
    }
    // The lamp goes out while the board turns over and lights for the new remark when it lands.
    lightLamp(lampRef.current, null);
    pendingLamp.current = board.lamp;
    wake();
  }, [index, reducedMotion, wake]);

  // On screen with a board that has landed (the opening one, or one that
  // landed before the tile went off screen): hold it, then turn over. A
  // board still turning starts its hold from the frame loop when it lands.
  useEffect(() => {
    if (!active || reducedMotion) return;
    if (pendingLamp.current === undefined) holdThenTurn();
    return () => window.clearTimeout(holdTimer.current);
  }, [active, reducedMotion, holdThenTurn]);

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
      <div ref={miniRef} className="sf-housing sf-mini" data-theme={theme}>
        <Screws />
        <div className="sf-mini-head">
          <span className="sf-caps">Departures</span>
          <span ref={lampRef} className="sf-lamp" />
        </div>
        <div className="sf-bay">
          <div ref={gridHostRef} className="sf-grid" />
        </div>
      </div>
    </div>
  );
}
