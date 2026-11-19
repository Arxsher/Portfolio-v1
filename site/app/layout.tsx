import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";
import { CommandBar } from "@/components/command/command-bar";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { pieces } from "@/components/lab/registry";
import { ScrollTop } from "@/components/scroll-top";
import { PullReload } from "@/components/pull-reload";
import { ScrollFx } from "@/components/scroll-fx";
import { StarIntro, StarIntroScript } from "@/components/star-intro";
import { projects, site } from "@/content/site";
import { themeScript } from "@/lib/theme-script";
import "./globals.css";

const xHandle = site.socials.find((social) => social.name === "X")?.handle;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.metaTitle,
    template: `%s • ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: site.metaTitle,
    description: site.description,
    images: [{ url: site.ogImage, ...site.ogImageSize, alt: site.metaTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.metaTitle,
    description: site.description,
    images: [{ url: site.ogImage, alt: site.metaTitle }],
    creator: xHandle,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-light-32x32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfb" },
    // AMOLED, the default dark palette; lib/theme.ts retints both metas
    // to whichever palette is picked.
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Breadcrumb titles for detail pages, keyed by "segment/slug".
const pageTitles = Object.fromEntries([
  ...projects.map((project) => [`projects/${project.slug}`, project.name]),
  ...pieces.map((piece) => [`lab/${piece.slug}`, piece.title]),
]);

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme and palette (class="dark",
            data-palette) before first paint (see lib/theme.ts). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Decides whether the first-load star intro plays and, if so,
            veils the page before first paint (components/star-intro.tsx). */}
        <StarIntroScript />
        {/* Marks that scripts run, so the home hero can start short (its
            hidden words show in full without JavaScript). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.dataset.js=''" }} />
      </head>
      <body className="flex min-h-full flex-col">
        <StarIntro />
        <a
          href="#main"
          className="pointer-events-none fixed top-3 left-3 z-50 -translate-y-[calc(100%+24px)] rounded-[10px] bg-float px-3 py-2 text-[13px] font-medium text-primary opacity-0 shadow-float transition-[translate,opacity] duration-150 ease-out focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100"
        >
          Skip to content
        </a>
        {/* The 628px content column (676px with its 24px gutters); lab pages
            widen it (see "Wide pages" in globals.css). */}
        <div className="site-column mx-auto flex w-full max-w-content flex-1 flex-col px-6 pt-6">
          {/* The dock holds the header at the top while the home hero is
              pinned (globals.css); elsewhere it is just the header. */}
          <div className="header-dock">
            <Header handle={site.handle} pages={pageTitles} />
          </div>
          <main id="main" tabIndex={-1} className="flex flex-col outline-none">
            {children}
          </main>
          <Footer />
        </div>
        {/* Room for the floating dock so it never covers the footer. */}
        <div aria-hidden="true" className="h-24 shrink-0" />
        <CommandBar />
        <ScrollTop />
        <ScrollFx />
        <PullReload />
      </body>
    </html>
  );
}
