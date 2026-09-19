"use client";

import { exampleDraft, type CalendarDraft, type DraftIssue } from "@/lib/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type EventFormProps = {
  draft: CalendarDraft;
  issues: DraftIssue[];
  onChange: (draft: CalendarDraft) => void;
};

function messageFor(issues: DraftIssue[], field: DraftIssue["field"]) {
  return issues.find((issue) => issue.field === field)?.message;
}

export function EventForm({ draft, issues, onChange }: EventFormProps) {
  const zones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : ["UTC"];
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const startError = messageFor(issues, "start");
  const endError = messageFor(issues, "end");
  const zoneError = messageFor(issues, "timeZone");

  function patch(partial: Partial<CalendarDraft>) {
    onChange({ ...draft, ...partial });
  }

  return (
    <form
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Event</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Times use the timezone below, not the clock of whoever opens the link.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            className="h-11"
            value={draft.title}
            placeholder="Studio critique"
            onChange={(event) => patch({ title: event.target.value })}
            required
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl bg-muted px-3 py-3">
          <div>
            <Label htmlFor="all-day">All day</Label>
            <p id="all-day-hint" className="mt-1 text-sm text-muted-foreground">
              The end date is the last day, included.
            </p>
          </div>
          <Switch
            id="all-day"
            checked={draft.allDay}
            onCheckedChange={(checked) => patch({ allDay: checked })}
            aria-describedby="all-day-hint"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start-date">Starts</Label>
            <Input
              id="start-date"
              className="h-11"
              type="date"
              value={draft.startDate}
              aria-invalid={Boolean(startError)}
              aria-describedby={startError ? "start-error" : undefined}
              onChange={(event) => patch({ startDate: event.target.value })}
              required
            />
            {!draft.allDay ? (
              <Input
                id="start-time"
                className="h-11"
                type="time"
                step={60}
                value={draft.startTime}
                aria-invalid={Boolean(startError)}
                aria-label="Start time"
                onChange={(event) => patch({ startTime: event.target.value })}
                required
              />
            ) : null}
            {startError ? (
              <p id="start-error" className="text-sm text-destructive">
                {startError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">{draft.allDay ? "Last day" : "Ends"}</Label>
            <Input
              id="end-date"
              className="h-11"
              type="date"
              value={draft.endDate}
              aria-invalid={Boolean(endError)}
              aria-describedby={endError ? "end-error" : undefined}
              onChange={(event) => patch({ endDate: event.target.value })}
              required
            />
            {!draft.allDay ? (
              <Input
                id="end-time"
                className="h-11"
                type="time"
                step={60}
                value={draft.endTime}
                aria-invalid={Boolean(endError)}
                aria-label="End time"
                onChange={(event) => patch({ endTime: event.target.value })}
                required
              />
            ) : null}
            {endError ? (
              <p id="end-error" className="text-sm text-destructive">
                {endError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            className="h-11"
            list="timezones"
            spellCheck={false}
            autoComplete="off"
            value={draft.timeZone}
            aria-invalid={Boolean(zoneError)}
            aria-describedby={zoneError ? "timezone-error" : "timezone-hint"}
            onChange={(event) => patch({ timeZone: event.target.value })}
          />
          <datalist id="timezones">
            {zones.map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
          {zoneError ? (
            <p id="timezone-error" className="text-sm text-destructive">
              {zoneError}
            </p>
          ) : (
            <p id="timezone-hint" className="text-sm text-muted-foreground">
              {draft.timeZone === localZone ? (
                "This is your current timezone."
              ) : (
                <button
                  type="button"
                  className="underline decoration-border underline-offset-4 hover:decoration-foreground"
                  onClick={() => patch({ timeZone: localZone })}
                >
                  Use {localZone}
                </button>
              )}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            className="h-11"
            value={draft.location}
            placeholder="Room 2, or a video link"
            onChange={(event) => patch({ location: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            className="min-h-28"
            value={draft.description}
            placeholder="What should people know before they arrive?"
            onChange={(event) => patch({ description: event.target.value })}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-11"
          onClick={() => onChange(exampleDraft(draft.timeZone || localZone))}
        >
          Fill an example
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          onClick={() =>
            onChange({
              ...draft,
              title: "",
              description: "",
              location: "",
            })
          }
        >
          Clear text
        </Button>
      </div>
    </form>
  );
}
