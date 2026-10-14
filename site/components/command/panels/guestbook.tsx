"use client";

// "Sign the guestbook": the panel chrome around the guestbook's own sign
// form (components/guestbook/sign-form.tsx), which closes the bar when the
// signature is in.

import { GuestbookSignForm } from "@/components/guestbook/sign-form";
import type { CommandPrefill } from "@/lib/command";
import { VIEWS } from "../items";
import { Panel } from "./panel";

export function GuestbookPanel({
  prefill,
  onClose,
}: {
  /** Starting name and message, e.g. from openCommand("guestbook", prefill). */
  prefill?: Pick<CommandPrefill, "name" | "message">;
  onClose: () => void;
}) {
  const info = VIEWS.guestbook;
  return (
    <Panel title={info.title} description={info.description} icon="pen" onClose={onClose}>
      <GuestbookSignForm onDone={onClose} prefill={prefill} />
    </Panel>
  );
}
