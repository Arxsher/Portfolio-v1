import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, Reem_Kufi } from "next/font/google";
import type { ReactNode } from "react";
import { CommandBar } from "@/components/command/command-bar";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { pieces } from "@/components/lab/registry";
import { ScrollTop } from "@/components/scroll-top";
import { projects, site } from "@/content/site";
import { palette } from "@/lib/palette";
import { themeScript } from "@/lib/theme-script";
import "./globals.css";

// Type (DESIGN.md → Type). next/font downloads these at build time and
// serves them from the site itself; no requests to Google at runtime.
//   Fraunces         display serif: the name, titles, project names, italic turns
//   Instrument Sans  text and UI, letter-spaced small caps for labels
//   Reem Kufi        the city's Arabic name only (Arabic subset)
const display = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-instrument",
  display: "swap",
});

const arabic = Reem_Kufi({
  subsets: ["arabic"],
  variable: "--font-reem-kufi",
  display: "swap",
  preload: false,
});

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
    { media: "(prefers-color-scheme: light)", color: palette.light.ground },
    { media: "(prefers-color-scheme: dark)", color: palette.dark.ground },
  ],
};

// Titles of detail pages keyed by "segment/slug"; the header uses them to
// tell real pages from the 404.
const pageTitles = Object.fromEntries([
  ...projects.map((project) => [`projects/${project.slug}`, project.name]),
  ...pieces.map((piece) => [`lab/${piece.slug}`, piece.title]),
]);

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${arabic.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved theme before first paint (see lib/theme.ts). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {/* The shell (DESIGN.md → Shell): a sticky bar, the page in the
            1200px frame, the night footer. Pages lay themselves out inside
            the frame; reading pages use the `column` utility. */}
        <Header name={site.name} handle={site.handle} pages={pageTitles} />
        <main id="main" tabIndex={-1} className="frame flex flex-1 flex-col outline-none">
          {children}
        </main>
        <Footer />
        <CommandBar />
        <ScrollTop />
      </body>
    </html>
  );
}
