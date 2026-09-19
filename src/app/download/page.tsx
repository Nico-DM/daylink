import type { Metadata } from "next";
import { Suspense } from "react";
import { DownloadClient } from "@/components/download-client";

export const metadata: Metadata = {
  title: "Download calendar file",
  description: "Download an .ics file generated from an add-to-calendar link.",
};

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-xl px-4 py-16 text-sm text-muted-foreground">
          Preparing the calendar file…
        </p>
      }
    >
      <DownloadClient />
    </Suspense>
  );
}
