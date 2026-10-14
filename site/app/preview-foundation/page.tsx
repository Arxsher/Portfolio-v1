// Temporary QA page for the Foundation step (the integration step deletes preview-* routes).
import * as Icons from "@/components/icons";
import { Logo } from "@/components/logo";
import { Section } from "@/components/section";

const names = [
  "ArrowUpRight", "ChevronRight", "ChevronUp", "GitHub", "X", "Instagram", "Spotify", "Mail", "Calendar", "Home", "Pen",
  "Folder", "Doc", "Sparkle", "Moon", "Sun", "Monitor", "Copy", "Check", "Close", "Search", "Verified",
] as const;

export default function Preview() {
  return (
    <>
      <div className="mt-10 grid grid-cols-6 gap-3">
        {names.map((name) => {
          const Icon = Icons[name];
          return (
            <div key={name} className="flex flex-col items-center gap-2 rounded-[14px] bg-surface p-3 text-[11px] text-tertiary">
              <span className={name === "Verified" ? "text-verified" : "text-primary"}>
                <Icon size={48} />
              </span>
              <span className="flex items-center gap-2 text-primary">
                <Icon />
                <Icon size={13} />
              </span>
              {name}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-4 text-primary">
        <Logo size={64} /> <Logo /> <Logo className="size-3.5" />
        <button className="btn btn-solid"><Icons.Mail size={14} />Say hi</button>
        <button className="btn btn-soft"><Icons.Calendar size={14} />Book a call</button>
        <a className="btn btn-icon" href="#"><Icons.GitHub /></a>
        <a className="btn btn-icon" href="#"><Icons.X /></a>
        <a className="btn btn-icon" href="#"><Icons.Instagram /></a>
        <a className="btn btn-icon" href="#"><Icons.Spotify /></a>
      </div>
      <p className="mt-4 text-[13px]">Press <kbd className="kbd">/</kbd> to jump · <a className="link" href="#">underlined link</a></p>
      <Section id="s1" label="Work" count={6} action={{ label: "All work", href: "/projects/" }}>
        <div className="h-10 rounded-[18px] bg-card" />
      </Section>
      <Section id="s2" label="lab" count="5 shots" action={{ label: "github.com", href: "https://github.com", external: true }}>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={`size-2.5 rounded-[3px] bg-graph-${l}`} />
          ))}
          <span className="ms-4 text-quote-purple">❝</span><span className="text-quote-amber">❝</span><span className="text-quote-red">❝</span><span className="text-quote-blue">❝</span><span className="text-quote-green">❝</span>
          <span className="ms-4 size-2 rounded-full bg-status" />
        </div>
      </Section>
    </>
  );
}
