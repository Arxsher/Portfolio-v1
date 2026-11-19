// Tiny client-side event bus for the floating command bar. Any button on
// the page can open a view of the bar without importing the bar itself:
//
//   openCommand("say-hi", { message: "Hey!" })
//   openCommand()                      // the palette
//   closeCommand()
//   const off = onCommand((event) => { … }); off();

export type CommandView = "palette" | "say-hi" | "book-call" | "guestbook";

export type CommandPrefill = {
  name?: string;
  email?: string;
  message?: string;
};

export type CommandEvent =
  | { type: "open"; view: CommandView; prefill?: CommandPrefill }
  | { type: "close" };

export type CommandListener = (event: CommandEvent) => void;

const listeners = new Set<CommandListener>();

function emit(event: CommandEvent) {
  // Copy first so a listener can unsubscribe while we iterate.
  [...listeners].forEach((listener) => listener(event));
}

/** Open the command bar on a view (default: the palette). */
export function openCommand(view: CommandView = "palette", prefill?: CommandPrefill) {
  emit({ type: "open", view, prefill });
}

/** Close whatever the command bar is showing. */
export function closeCommand() {
  emit({ type: "close" });
}

/** Listen for open/close requests. Returns an unsubscribe function. */
export function onCommand(listener: CommandListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
