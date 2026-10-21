// The lab index: every piece, live, with filters, search and a list view.
// The interactive part is components/lab/lab-index.tsx; this page adds the
// heading and opts into the wide column (data-wide-page).

import type { Metadata } from "next";
import { LabIndex } from "@/components/lab/lab-index";
import { site } from "@/content/site";
import { withBasePath } from "@/components/lab/base-path";

const intro =
  "Small interactive pieces: interactions, objects, data and scenes, all drawn in code and running live in your browser.";

export const metadata: Metadata = {
  title: "Lab",
  description: intro,
  alternates: { canonical: withBasePath("/lab/") },
  // Page-level openGraph replaces the layout's, so the shared bits are repeated.
  openGraph: {
    type: "website",
    url: withBasePath("/lab/"),
    siteName: site.name,
    title: `Lab • ${site.name}`,
    description: intro,
    images: [{ url: withBasePath(site.ogImage), ...site.ogImageSize, alt: site.metaTitle }],
  },
};

export default function LabPage() {
  return (
    <div data-wide-page="" className="flex flex-col">
      <header className="mt-16">
        <h1 className="page-title">Lab</h1>
        <p className="page-lede mt-3">{intro}</p>
      </header>
      <LabIndex />
    </div>
  );
}
