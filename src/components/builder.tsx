"use client";

import { useEffect, useMemo, useState } from "react";
import {
  assess,
  defaultDraft,
  fromQuery,
  hasEventQuery,
  type CalendarDraft,
} from "@/lib/calendar";
import { EventForm } from "@/components/event-form";
import { LinkPanel } from "@/components/link-panel";

export function Builder() {
  const [draft, setDraft] = useState<CalendarDraft | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    const base = defaultDraft();
    const params = new URLSearchParams(window.location.search);
    // The first render has to match the server. Window is only safe after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only event draft
    setDraft(hasEventQuery(params) ? fromQuery(params, base) : base);
    setOrigin(window.location.origin);
  }, []);

  const status = useMemo(() => (draft ? assess(draft) : null), [draft]);

  if (!draft || !status) {
    return (
      <p className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted-foreground sm:px-6">
        Loading the form…
      </p>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2">
      <EventForm draft={draft} issues={status.issues} onChange={setDraft} />
      <LinkPanel draft={draft} status={status} origin={origin} />
    </div>
  );
}
