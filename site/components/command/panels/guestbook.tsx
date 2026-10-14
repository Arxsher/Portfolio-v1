"use client";

// "Sign the guestbook": the sheet's chrome around the guestbook's own sign
// form (components/guestbook/sign-form.tsx), which closes the sheet once
// the signature is in.

import { GuestbookSignForm } from "@/components/guestbook/sign-form";
import type { CommandPrefill } from "@/lib/command";
import { PANELS } from "../items";
import { Panel, type PanelProps } from "./panel";

export function GuestbookPanel({
  titleId,
  onBack,
  onClose,
  prefill,
}: PanelProps & {
  /** Starting name and message, e.g. from openCommand("guestbook", prefill). */
  prefill?: Pick<CommandPrefill, "name" | "message">;
}) {
  const info = PANELS.guestbook;
  return (
    <Panel titleId={titleId} title={info.title} description={info.description} onBack={onBack} onClose={onClose}>
      <GuestbookSignForm onDone={onClose} prefill={prefill} />
    </Panel>
  );
}
