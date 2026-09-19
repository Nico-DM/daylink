import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import {
  assess,
  buildLinks,
  describeWhen,
  exampleDraft,
  fromQuery,
  htmlSnippet,
  icsFilename,
  issuesFor,
  toQuery,
  type CalendarDraft,
} from "./calendar.ts";

const NOW = DateTime.fromISO("2026-01-01T00:00:00Z", { zone: "utc" });

function timedDraft(overrides: Partial<CalendarDraft> = {}): CalendarDraft {
  return {
    title: "Studio critique",
    description: "Bring one question.",
    location: "Room 2",
    allDay: false,
    startDate: "2026-01-15",
    endDate: "2026-01-15",
    startTime: "10:00",
    endTime: "11:00",
    timeZone: "America/New_York",
    ...overrides,
  };
}

test("Google keeps the wall clock and timezone name", () => {
  const url = new URL(buildLinks(timedDraft(), NOW).google);
  assert.equal(url.origin + url.pathname, "https://calendar.google.com/calendar/render");
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("text"), "Studio critique");
  assert.equal(url.searchParams.get("dates"), "20260115T100000/20260115T110000");
  assert.equal(url.searchParams.get("ctz"), "America/New_York");
  assert.equal(url.searchParams.get("details"), "Bring one question.");
  assert.equal(url.searchParams.get("location"), "Room 2");
});

test("Outlook links use UTC and both hosts", () => {
  const links = buildLinks(timedDraft(), NOW);
  for (const [href, host] of [
    [links.outlookLive, "outlook.live.com"],
    [links.outlook365, "outlook.office.com"],
  ] as const) {
    const url = new URL(href);
    assert.equal(url.host, host);
    assert.equal(url.searchParams.get("rru"), "addevent");
    assert.equal(url.searchParams.get("subject"), "Studio critique");
    assert.equal(url.searchParams.get("startdt"), "2026-01-15T15:00:00Z");
    assert.equal(url.searchParams.get("enddt"), "2026-01-15T16:00:00Z");
    assert.equal(url.searchParams.get("allday"), "false");
    assert.equal(url.searchParams.get("body"), "Bring one question.");
    assert.equal(url.searchParams.get("location"), "Room 2");
  }
});

test("timed ICS is UTC and escapes text", () => {
  const ics = buildLinks(
    timedDraft({
      title: "Plan; ship",
      description: "Line one\nLine two, with a comma",
      location: "Room \\ hall",
    }),
    NOW,
  ).ics;
  assert.match(ics, /DTSTART:20260115T150000Z/);
  assert.match(ics, /DTEND:20260115T160000Z/);
  assert.match(ics, /SUMMARY:Plan\\; ship/);
  assert.match(ics, /DESCRIPTION:Line one\\nLine two\\, with a comma/);
  assert.match(ics, /LOCATION:Room \\\\ hall/);
  assert.match(ics, /DTSTAMP:20260101T000000Z/);
  assert.ok(ics.endsWith("\r\n"));
  assert.ok(!ics.includes("\n\n"));
});

test("all-day links include the last day the user picked", () => {
  const draft = timedDraft({
    allDay: true,
    startDate: "2026-01-15",
    endDate: "2026-01-16",
    description: "",
    location: "",
  });
  const links = buildLinks(draft, NOW);
  const google = new URL(links.google);
  assert.equal(google.searchParams.get("dates"), "20260115/20260117");
  assert.equal(google.searchParams.get("ctz"), null);

  const outlook = new URL(links.outlookLive);
  assert.equal(outlook.searchParams.get("startdt"), "2026-01-15");
  assert.equal(outlook.searchParams.get("enddt"), "2026-01-17");
  assert.equal(outlook.searchParams.get("allday"), "true");
  assert.equal(outlook.searchParams.get("body"), null);

  assert.match(links.ics, /DTSTART;VALUE=DATE:20260115/);
  assert.match(links.ics, /DTEND;VALUE=DATE:20260117/);
});

test("ICS lines fold on octet boundaries", () => {
  const ics = buildLinks(
    timedDraft({ description: "A".repeat(120) }),
    NOW,
  ).ics;
  const description = ics.split("\r\n").filter((line) => line.startsWith("DESCRIPTION") || line.startsWith(" "));
  assert.ok(description.length > 1);
  const encoder = new TextEncoder();
  for (const line of ics.split("\r\n")) {
    assert.ok(encoder.encode(line).length <= 75, line);
  }
});

test("overnight events are valid and same-instant events are not", () => {
  assert.deepEqual(
    issuesFor(
      timedDraft({
        startDate: "2026-01-15",
        startTime: "22:00",
        endDate: "2026-01-16",
        endTime: "01:00",
      }),
    ),
    [],
  );
  const same = issuesFor(timedDraft({ endTime: "10:00" }));
  assert.equal(same.some((issue) => issue.field === "end"), true);
});

test("a one-day all-day event is valid", () => {
  const status = assess(timedDraft({ allDay: true }), NOW);
  assert.equal(status.ok, true);
});

test("missing title is incomplete, not an error", () => {
  const status = assess(timedDraft({ title: "   " }), NOW);
  assert.equal(status.ok, false);
  if (!status.ok) assert.equal(status.kind, "incomplete");
});

test("bad dates and timezones are field errors", () => {
  const issues = issuesFor(
    timedDraft({ startDate: "2026-02-31", timeZone: "Not/AZone", endDate: "2026-02-10" }),
  );
  assert.ok(issues.some((issue) => issue.field === "start"));
  assert.ok(issues.some((issue) => issue.field === "timeZone"));
});

test("query strings round-trip titles with reserved characters", () => {
  const draft = timedDraft({ title: "A & B + C", description: "Line\nbreak" });
  const again = fromQuery(new URLSearchParams(toQuery(draft)));
  assert.equal(again.title, "A & B + C");
  assert.equal(again.description, "Line\nbreak");
  assert.equal(again.timeZone, "America/New_York");
  assert.equal(again.allDay, false);
  assert.equal(again.startTime, "10:00");
});

test("html snippet escapes the title and href", () => {
  const snippet = htmlSnippet({
    title: `Tom & Jerry <script>`,
    google: `https://calendar.google.com/calendar/render?text=a&b="c"`,
    outlookLive: "https://outlook.live.com/calendar/0/deeplink/compose?subject=a",
    outlook365: "https://outlook.office.com/calendar/0/deeplink/compose?subject=a",
    icsUrl: "https://example.com/download/?title=a",
  });
  assert.match(snippet, /Tom &amp; Jerry &lt;script&gt;/);
  assert.match(snippet, /text=a&amp;b=&quot;c&quot;/);
  assert.doesNotMatch(snippet, /<script>/);
});

test("filenames stay portable", () => {
  assert.equal(icsFilename("Café / launch!"), "cafe-launch.ics");
  assert.equal(icsFilename("???"), "event.ics");
});

test("describeWhen spells out a same-day timed event", () => {
  assert.equal(
    describeWhen(timedDraft()),
    "Thursday, January 15, 2026, 10:00 AM – 11:00 AM (EST)",
  );
});

test("example draft is immediately linkable", () => {
  const draft = exampleDraft("UTC", DateTime.fromISO("2026-05-01T12:00:00Z"));
  const status = assess(draft, NOW);
  assert.equal(status.ok, true);
  if (status.ok) {
    assert.equal(status.links.filename, "studio-critique.ics");
  }
});
