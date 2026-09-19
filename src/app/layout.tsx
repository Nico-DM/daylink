import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "Daylink — Add to calendar links",
    template: "%s — Daylink",
  },
  description:
    "Create Google Calendar, Outlook, and ICS links in the browser. Nothing is uploaded. Free to host on GitHub Pages.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <span aria-hidden className="size-2.5 rounded-full bg-clay" />
              <span className="font-display text-2xl tracking-tight">Daylink</span>
            </Link>
            <p className="text-sm text-primary-foreground/80">Nothing is uploaded</p>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm leading-relaxed text-muted-foreground sm:px-6">
            Google and Outlook links open those calendars with the event filled in.
            The calendar-file link downloads a standard .ics file. Daylink does not
            keep a copy.
          </div>
        </footer>
      </body>
    </html>
  );
}
