"use client";

// Temporary QA page for the guestbook area (the integration step deletes
// preview-* routes). It shows the home section, the sign form inside a
// stand-in for the command panel, and the /guestbook wall.
//
// By default everything runs against the site's own guestbook client (not
// configured yet → the "not connected" states). In development,
// ?endpoint=<url> points the views at another Supabase-compatible REST
// endpoint instead, which is how the populated layout is checked (the QA
// script answers those requests; no data lives in this file).

import { useEffect, useState } from "react";
import { GuestbookClientProvider, useGuestbookClient } from "@/components/guestbook/data";
import { GUESTBOOK_PANEL, GuestbookSignForm } from "@/components/guestbook/sign-form";
import { GuestbookWall, SignItButton } from "@/components/guestbook/wall";
import { Guestbook } from "@/components/home/guestbook";
import { Close, Pen } from "@/components/icons";
import { Logo } from "@/components/logo";
import { createGuestbookClient, guestbookClient, type GuestbookClient } from "@/lib/guestbook";

export default function PreviewGuestbook() {
  const [client, setClient] = useState<GuestbookClient>(guestbookClient);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const endpoint = new URLSearchParams(window.location.search).get("endpoint");
    // Switching the client once after mount; the views reload with it.
    if (endpoint) setClient(createGuestbookClient({ url: endpoint, anonKey: "preview-key" }));
  }, []);

  return (
    <GuestbookClientProvider client={client}>
      <Body key={client === guestbookClient ? "site" : "endpoint"} />
    </GuestbookClientProvider>
  );
}

function Body() {
  const client = useGuestbookClient();
  const [formKey, setFormKey] = useState(0);
  return (
    <>
      <p className="mt-10 text-[12px] text-tertiary">
        preview-guestbook · client: {client === guestbookClient ? "site config" : "endpoint override"} ·{" "}
        {client.enabled ? "enabled" : "not configured"}
      </p>

      <Guestbook />

      <section className="mt-20" aria-label="Sign form preview">
        <h2 className="text-[13px] text-secondary">sign form (in a stand-in panel)</h2>
        <div id="panel" className="mt-4 flex justify-center">
          <div className="w-[540px] max-w-full overflow-hidden rounded-[20px] bg-raised shadow-popover">
            <div className="p-3">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-surface text-primary">
                  <Pen size={14} />
                </span>
                <div className="min-w-0 flex-1 leading-[1.35]">
                  <h3 className="text-[15px] font-medium text-primary">{GUESTBOOK_PANEL.title}</h3>
                  <p className="text-[13px] text-secondary">{GUESTBOOK_PANEL.description}</p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setFormKey((k) => k + 1)}
                  className="-me-1 -mt-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[12px] text-tertiary transition-colors duration-150 hover:bg-control hover:text-primary"
                >
                  <Close size={15} />
                </button>
              </div>
              <GuestbookSignForm key={formKey} onDone={() => setFormKey((k) => k + 1)} />
            </div>
            <div className="mx-3 h-px bg-border" />
            <div className="flex h-12 items-center gap-3 ps-4 pe-2.5">
              <Logo size={16} className="text-primary" />
              <span className="flex-1 text-[14px] text-primary">guestbook</span>
              <span className="flex h-7 items-center rounded-[10px] bg-control px-2.5 text-[11px] text-secondary">esc</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20" aria-label="Guestbook page preview">
        <h2 className="text-[13px] text-secondary">/guestbook body</h2>
        <header className="mt-16">
          <h1 className="text-[30px] leading-[1.15] tracking-[-0.025em] text-balance text-primary">Guestbook</h1>
          <div className="mt-3 max-w-[56ch] text-[16px] leading-[1.5] text-pretty">
            <p>Notes from people who passed through, each one signed by hand.</p>
            <div className="mt-5 flex">
              <SignItButton />
            </div>
          </div>
        </header>
        <GuestbookWall />
      </section>
    </>
  );
}
