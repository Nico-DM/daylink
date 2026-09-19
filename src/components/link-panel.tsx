"use client";

import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  describeWhen,
  htmlSnippet,
  plainTextLinks,
  withBasePath,
  type CalendarDraft,
  type DraftStatus,
} from "@/lib/calendar";
import { downloadIcs } from "@/lib/download";
import { cn } from "@/lib/utils";

type LinkPanelProps = {
  draft: CalendarDraft;
  status: DraftStatus;
  origin: string;
};

const LONG_LINK = 1900;

export function LinkPanel({ draft, status, origin }: LinkPanelProps) {
  const when = describeWhen(draft);
  const ready = status.ok;
  const icsUrl =
    ready && origin
      ? `${origin}${withBasePath(`/download/?${status.links.query}`)}`
      : "";
  const formUrl =
    ready && origin ? `${origin}${withBasePath(`/?${status.links.query}`)}` : "";

  const rows = [
    {
      id: "google",
      name: "Google Calendar",
      detail: "Opens Google with the event filled in. The timezone name is kept.",
      href: ready ? status.links.google : "",
      action: "Open",
      external: true,
    },
    {
      id: "outlook",
      name: "Outlook.com",
      detail: "For personal Microsoft accounts.",
      href: ready ? status.links.outlookLive : "",
      action: "Open",
      external: true,
    },
    {
      id: "microsoft",
      name: "Microsoft 365",
      detail: "For work and school accounts.",
      href: ready ? status.links.outlook365 : "",
      action: "Open",
      external: true,
    },
    {
      id: "ics",
      name: "Calendar file",
      detail: "Apple Calendar, Thunderbird, and most other apps. This link downloads an .ics file.",
      href: icsUrl,
      action: "Download",
      external: false,
    },
  ];

  const longest = rows.reduce((max, row) => Math.max(max, row.href.length), formUrl.length);
  const snippet =
    ready && icsUrl
      ? htmlSnippet({
          title: draft.title,
          google: status.links.google,
          outlookLive: status.links.outlookLive,
          outlook365: status.links.outlook365,
          icsUrl,
        })
      : "";
  const plain =
    ready && icsUrl
      ? plainTextLinks({
          title: draft.title,
          google: status.links.google,
          outlookLive: status.links.outlookLive,
          outlook365: status.links.outlook365,
          icsUrl,
        })
      : "";

  return (
    <section
      aria-labelledby="links-heading"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <h2 id="links-heading" className="font-display text-2xl tracking-tight">
        Links
      </h2>
      <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
        {ready
          ? when
          : status.kind === "invalid"
            ? "Fix the date or timezone. The links stay hidden until the event is possible."
            : status.message}
      </p>
      {ready && draft.location.trim() ? (
        <p className="mt-1 text-sm text-muted-foreground">{draft.location.trim()}</p>
      ) : null}

      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-border p-3">
            <h3 className="text-sm font-medium">{row.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{row.detail}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                readOnly
                spellCheck={false}
                aria-label={`${row.name} link`}
                value={row.href}
                placeholder="Add a title to generate this link"
                className="h-11 font-mono text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <CopyButton
                value={row.href}
                label="Copy"
                ariaLabel={`Copy ${row.name} link`}
                variant="outline"
                disabled={!row.href}
              />
            </div>
            <div className="mt-2">
              {row.id === "ics" && ready ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  onClick={() => downloadIcs(status.links.ics, status.links.filename)}
                >
                  <Download />
                  Download {status.links.filename}
                </Button>
              ) : row.external && row.href ? (
                <a
                  className={cn(buttonVariants({ variant: "outline" }), "h-11")}
                  href={row.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink />
                  {row.action}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {ready && longest > LONG_LINK ? (
        <p className="mt-4 text-sm text-destructive">
          These links are long. Some email apps cut links off around 2,000 characters.
          Shorten the description if you are pasting this into email.
        </p>
      ) : null}

      <div className="mt-5 space-y-3 border-t border-border pt-5">
        <h3 className="text-sm font-medium">For a website or a note</h3>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={snippet} label="Copy HTML" disabled={!snippet} />
          <CopyButton
            value={plain}
            label="Copy plain text"
            variant="outline"
            disabled={!plain}
          />
          <CopyButton
            value={formUrl}
            label="Copy form link"
            variant="outline"
            disabled={!formUrl}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          The form link opens this page again with the same event, so you can edit it later.
          The calendar-file link is the one to give other people.
        </p>
      </div>
    </section>
  );
}

function CopyButton({
  value,
  label,
  ariaLabel,
  disabled,
  variant = "default",
}: {
  value: string;
  label: string;
  ariaLabel?: string;
  disabled?: boolean;
  variant?: "default" | "outline";
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto">
      <Button
        type="button"
        className="h-11 w-full sm:w-auto"
        variant={variant}
        aria-label={ariaLabel ?? label}
        disabled={disabled || !value}
        onClick={copy}
      >
        {state === "copied" ? "Copied" : label}
      </Button>
      {state === "failed" ? (
        <p className="text-xs text-destructive" role="status">
          Couldn&apos;t copy. Select the link and copy it yourself.
        </p>
      ) : null}
    </div>
  );
}
