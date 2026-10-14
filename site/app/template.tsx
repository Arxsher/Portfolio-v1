import { ViewTransition, type ReactNode } from "react";

// Each top-level route change plays the page transition defined in
// globals.css (`.page`): the old page fades out quickly and the new one
// settles up 12px, like a sheet of paper laid down. The top bar, the
// footer and the back-to-top button stay put (they have their own
// view-transition names). Reduced motion turns it into a plain cut.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" update="none" default="none">
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
