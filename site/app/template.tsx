import { ViewTransition, type ReactNode } from "react";

// Each top-level route change plays the page transition defined in
// globals.css (`.page`): the old page blurs out quickly, the new one rises
// 10px and un-blurs. Header, footer and the floating dock stay put.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" update="none" default="none">
      <div className="flex flex-col">{children}</div>
    </ViewTransition>
  );
}
