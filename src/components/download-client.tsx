"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  assess,
  defaultDraft,
  describeWhen,
  fromQuery,
  hasEventQuery,
} from "@/lib/calendar";
import { downloadIcs } from "@/lib/download";

export function DownloadClient() {
  const params = useSearchParams();
  const hasEvent = hasEventQuery(params);
  const draft = useMemo(
    () => fromQuery(params, defaultDraft()),
    [params],
  );
  const status = useMemo(() => assess(draft), [draft]);
  const started = useRef(false);

  useEffect(() => {
    if (!status.ok || started.current) return;
    started.current = true;
    downloadIcs(status.links.ics, status.links.filename);
  }, [status]);

  const editHref = hasEvent ? `/?${params.toString()}` : "/";

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-medium tracking-wide text-clay uppercase">
        Calendar file
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        {status.ok ? draft.title.trim() : "This link needs a fix"}
      </h1>

      {!hasEvent ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          This address downloads an .ics file. Make the event first, then share the
          calendar-file link from the home page.
        </p>
      ) : null}

      {hasEvent && !status.ok ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {status.kind === "incomplete"
            ? "The link is missing a title."
            : "The dates or timezone in this link are not usable, so the file was not downloaded."}
        </p>
      ) : null}

      {status.ok ? (
        <>
          <p className="mt-4 text-base leading-relaxed">
            {describeWhen(draft)}
            {draft.location.trim() ? ` · ${draft.location.trim()}` : ""}
          </p>
          {draft.description.trim() ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {draft.description.trim()}
            </p>
          ) : null}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            The file should download on its own. If it did not, use the button. Open it
            with Apple Calendar, Thunderbird, or any other app that reads .ics files.
          </p>
          <Button
            type="button"
            className="mt-6 h-11"
            onClick={() => downloadIcs(status.links.ics, status.links.filename)}
          >
            <Download />
            Download {status.links.filename}
          </Button>
        </>
      ) : null}

      <p className="mt-8">
        <Link
          href={editHref}
          className="text-sm underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          {hasEvent ? "Edit this event" : "Make a calendar link"}
        </Link>
      </p>
    </main>
  );
}
