import { DateTime } from "luxon";

export type CalendarDraft = {
  title: string;
  description: string;
  location: string;
  allDay: boolean;
  /** Inclusive calendar date, YYYY-MM-DD. */
  startDate: string;
  /** Inclusive last day, YYYY-MM-DD. */
  endDate: string;
  /** HH:mm, ignored when allDay is true. */
  startTime: string;
  /** HH:mm, ignored when allDay is true. */
  endTime: string;
  timeZone: string;
};

export type IssueField = "start" | "end" | "timeZone";

export type DraftIssue = {
  field: IssueField;
  message: string;
};

export type BuiltLinks = {
  google: string;
  outlookLive: string;
  outlook365: string;
  ics: string;
  filename: string;
  query: string;
};

export type DraftStatus =
  | { ok: false; kind: "incomplete"; message: string; issues: DraftIssue[] }
  | { ok: false; kind: "invalid"; issues: DraftIssue[] }
  | { ok: true; links: BuiltLinks; issues: [] };

const OUTLOOK_LIVE = "https://outlook.live.com/calendar/0/deeplink/compose";
const OUTLOOK_365 = "https://outlook.office.com/calendar/0/deeplink/compose";
const GOOGLE = "https://calendar.google.com/calendar/render";

const QUERY_KEYS = {
  title: "title",
  details: "details",
  location: "location",
  allDay: "allday",
  start: "start",
  end: "end",
  startTime: "stime",
  endTime: "etime",
  tz: "tz",
} as const;

export function defaultDraft(now = DateTime.now()): CalendarDraft {
  const zone = now.isValid && now.zoneName ? now.zoneName : "UTC";
  const zoned = now.setZone(zone);
  const day = (zoned.isValid ? zoned : DateTime.utc()).plus({ days: 1 });
  return {
    title: "",
    description: "",
    location: "",
    allDay: false,
    startDate: day.toFormat("yyyy-MM-dd"),
    endDate: day.toFormat("yyyy-MM-dd"),
    startTime: "10:00",
    endTime: "11:00",
    timeZone: zoned.isValid ? zone : "UTC",
  };
}

export function exampleDraft(
  timeZone: string,
  now = DateTime.now().setZone(timeZone),
): CalendarDraft {
  const base = now.isValid ? now : DateTime.utc();
  const day = base.plus({ days: 1 });
  return {
    title: "Studio critique",
    description:
      "Look at the homepage, the empty state, and these calendar links. Bring one question.",
    location: "Room 2",
    allDay: false,
    startDate: day.toFormat("yyyy-MM-dd"),
    endDate: day.toFormat("yyyy-MM-dd"),
    startTime: "16:00",
    endTime: "16:45",
    timeZone: now.isValid ? timeZone : "UTC",
  };
}

export function hasEventQuery(params: URLSearchParams): boolean {
  return Object.values(QUERY_KEYS).some((key) => params.has(key));
}

export function fromQuery(
  params: URLSearchParams,
  fallback: CalendarDraft = defaultDraft(),
): CalendarDraft {
  const pick = (key: string, current: string) =>
    params.has(key) ? (params.get(key) ?? "") : current;

  const allDay = params.has(QUERY_KEYS.allDay)
    ? ["1", "true", "yes"].includes(
        (params.get(QUERY_KEYS.allDay) ?? "").toLowerCase(),
      )
    : fallback.allDay;

  return {
    title: pick(QUERY_KEYS.title, fallback.title),
    description: pick(QUERY_KEYS.details, fallback.description),
    location: pick(QUERY_KEYS.location, fallback.location),
    allDay,
    startDate: pick(QUERY_KEYS.start, fallback.startDate),
    endDate: pick(QUERY_KEYS.end, fallback.endDate),
    startTime: pick(QUERY_KEYS.startTime, fallback.startTime),
    endTime: pick(QUERY_KEYS.endTime, fallback.endTime),
    timeZone: pick(QUERY_KEYS.tz, fallback.timeZone),
  };
}

export function toQuery(draft: CalendarDraft): string {
  const params = new URLSearchParams();
  params.set(QUERY_KEYS.title, draft.title.trim());
  const description = draft.description.trim();
  const location = draft.location.trim();
  if (description) params.set(QUERY_KEYS.details, description);
  if (location) params.set(QUERY_KEYS.location, location);
  params.set(QUERY_KEYS.allDay, draft.allDay ? "1" : "0");
  params.set(QUERY_KEYS.start, draft.startDate);
  params.set(QUERY_KEYS.end, draft.endDate);
  if (!draft.allDay) {
    params.set(QUERY_KEYS.startTime, draft.startTime);
    params.set(QUERY_KEYS.endTime, draft.endTime);
  }
  params.set(QUERY_KEYS.tz, draft.timeZone.trim());
  return params.toString();
}

export function issuesFor(draft: CalendarDraft): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const startDate = parseDate(draft.startDate);
  const endDate = parseDate(draft.endDate);

  if (!startDate) {
    issues.push({ field: "start", message: "Use a real start date." });
  }
  if (!endDate) {
    issues.push({ field: "end", message: "Use a real end date." });
  }

  if (!draft.allDay) {
    if (!parseTime(draft.startTime)) {
      issues.push({ field: "start", message: "Use a start time like 10:00." });
    }
    if (!parseTime(draft.endTime)) {
      issues.push({ field: "end", message: "Use an end time like 11:00." });
    }
  }

  const zone = draft.timeZone.trim();
  const zoneOk = isTimeZone(zone);
  if (!zoneOk) {
    issues.push({
      field: "timeZone",
      message: "Pick a timezone, such as America/New_York or UTC.",
    });
  }

  if (issues.length > 0 || !startDate || !endDate) return issues;

  if (draft.allDay) {
    if (draft.endDate < draft.startDate) {
      issues.push({
        field: "end",
        message: "The last day has to be the start date or later.",
      });
    }
    return issues;
  }

  const start = zoned(draft.startDate, draft.startTime, zone);
  const end = zoned(draft.endDate, draft.endTime, zone);
  if (!start.isValid) {
    issues.push({
      field: "start",
      message: "That start time does not exist in this timezone.",
    });
  }
  if (!end.isValid) {
    issues.push({
      field: "end",
      message: "That end time does not exist in this timezone.",
    });
  }
  if (start.isValid && end.isValid && end <= start) {
    issues.push({
      field: "end",
      message: "The end has to come after the start.",
    });
  }
  return issues;
}

export function assess(
  draft: CalendarDraft,
  now = DateTime.utc(),
): DraftStatus {
  const issues = issuesFor(draft);
  if (issues.length > 0) return { ok: false, kind: "invalid", issues };
  if (!draft.title.trim()) {
    return {
      ok: false,
      kind: "incomplete",
      issues: [],
      message: "Add a title. Links appear as soon as the event has a name.",
    };
  }
  return { ok: true, issues: [], links: buildLinks(draft, now) };
}

export function buildLinks(draft: CalendarDraft, now = DateTime.utc()): BuiltLinks {
  const title = draft.title.trim();
  const description = draft.description.trim();
  const location = draft.location.trim();
  const zone = draft.timeZone.trim();

  return {
    google: googleUrl({ title, description, location, draft, zone }),
    outlookLive: outlookUrl(OUTLOOK_LIVE, { title, description, location, draft, zone }),
    outlook365: outlookUrl(OUTLOOK_365, { title, description, location, draft, zone }),
    ics: buildIcs({ title, description, location, draft, zone, now }),
    filename: icsFilename(title),
    query: toQuery(draft),
  };
}

export function describeWhen(draft: CalendarDraft): string | null {
  if (issuesFor(draft).length > 0) return null;
  const zone = draft.timeZone.trim();

  if (draft.allDay) {
    const start = DateTime.fromISO(draft.startDate, { zone });
    const end = DateTime.fromISO(draft.endDate, { zone });
    if (!start.isValid || !end.isValid) return null;
    if (draft.startDate === draft.endDate) {
      return start.toFormat("cccc, LLLL d, yyyy");
    }
    const sameYear = start.year === end.year;
    const startText = start.toFormat(sameYear ? "LLLL d" : "LLLL d, yyyy");
    return `${startText} – ${end.toFormat("LLLL d, yyyy")}`;
  }

  const start = zoned(draft.startDate, draft.startTime, zone);
  const end = zoned(draft.endDate, draft.endTime, zone);
  if (!start.isValid || !end.isValid) return null;
  const zoneName = start.toFormat("ZZZZ");
  if (start.hasSame(end, "day")) {
    return `${start.toFormat("cccc, LLLL d, yyyy")}, ${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")} (${zoneName})`;
  }
  return `${start.toFormat("LLLL d, yyyy, h:mm a")} – ${end.toFormat("LLLL d, yyyy, h:mm a")} (${zoneName})`;
}

export function htmlSnippet(input: {
  title: string;
  google: string;
  outlookLive: string;
  outlook365: string;
  icsUrl: string;
}): string {
  const title = escapeHtml(input.title.trim() || "event");
  const item = (href: string, label: string, blank: boolean) => {
    const extra = blank ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `  <li><a href="${escapeHtml(href)}"${extra}>${label}</a></li>`;
  };
  return [
    `<p>Add <strong>${title}</strong> to your calendar:</p>`,
    "<ul>",
    item(input.google, "Google Calendar", true),
    item(input.outlookLive, "Outlook.com", true),
    item(input.outlook365, "Microsoft 365", true),
    item(input.icsUrl, "Apple Calendar and other apps (.ics)", false),
    "</ul>",
  ].join("\n");
}

export function plainTextLinks(input: {
  title: string;
  google: string;
  outlookLive: string;
  outlook365: string;
  icsUrl: string;
}): string {
  const title = input.title.trim() || "event";
  return [
    `Add "${title}" to your calendar`,
    `Google Calendar: ${input.google}`,
    `Outlook.com: ${input.outlookLive}`,
    `Microsoft 365: ${input.outlook365}`,
    `Calendar file: ${input.icsUrl}`,
  ].join("\n");
}

export function withBasePath(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function googleUrl(input: EventParts): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: googleDates(input.draft, input.zone),
  });
  if (!input.draft.allDay) params.set("ctz", input.zone);
  if (input.description) params.set("details", input.description);
  if (input.location) params.set("location", input.location);
  return `${GOOGLE}?${params.toString()}`;
}

function outlookUrl(base: string, input: EventParts): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: input.title,
    startdt: outlookStart(input.draft, input.zone),
    enddt: outlookEnd(input.draft, input.zone),
    allday: input.draft.allDay ? "true" : "false",
  });
  if (input.description) params.set("body", input.description);
  if (input.location) params.set("location", input.location);
  return `${base}?${params.toString()}`;
}

function googleDates(draft: CalendarDraft, zone: string): string {
  if (draft.allDay) {
    return `${compactDate(draft.startDate)}/${compactDate(exclusiveEndDate(draft.endDate))}`;
  }
  const start = zoned(draft.startDate, draft.startTime, zone);
  const end = zoned(draft.endDate, draft.endTime, zone);
  return `${start.toFormat("yyyyMMdd'T'HHmmss")}/${end.toFormat("yyyyMMdd'T'HHmmss")}`;
}

function outlookStart(draft: CalendarDraft, zone: string): string {
  if (draft.allDay) return draft.startDate;
  return zoned(draft.startDate, draft.startTime, zone)
    .toUTC()
    .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
}

function outlookEnd(draft: CalendarDraft, zone: string): string {
  // Outlook web, Google, and ICS all treat an all-day end as exclusive.
  if (draft.allDay) return exclusiveEndDate(draft.endDate);
  return zoned(draft.endDate, draft.endTime, zone)
    .toUTC()
    .toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
}

type EventParts = {
  title: string;
  description: string;
  location: string;
  draft: CalendarDraft;
  zone: string;
  now?: DateTime;
};

function buildIcs(input: EventParts & { now: DateTime }): string {
  const uid = `daylink-${fnv1a(`${input.title}|${input.draft.startDate}|${input.draft.endDate}|${input.draft.startTime}|${input.draft.endTime}|${input.zone}|${input.location}`)}@daylink`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Daylink//Add to Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${input.now.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}`,
  ];

  if (input.draft.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${compactDate(input.draft.startDate)}`);
    lines.push(
      `DTEND;VALUE=DATE:${compactDate(exclusiveEndDate(input.draft.endDate))}`,
    );
  } else {
    const start = zoned(input.draft.startDate, input.draft.startTime, input.zone).toUTC();
    const end = zoned(input.draft.endDate, input.draft.endTime, input.zone).toUTC();
    lines.push(`DTSTART:${start.toFormat("yyyyMMdd'T'HHmmss'Z'")}`);
    lines.push(`DTEND:${end.toFormat("yyyyMMdd'T'HHmmss'Z'")}`);
  }

  lines.push(`SUMMARY:${escapeIcs(input.title)}`);
  if (input.description) lines.push(`DESCRIPTION:${escapeIcs(input.description)}`);
  if (input.location) lines.push(`LOCATION:${escapeIcs(input.location)}`);
  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export function icsFilename(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${slug || "event"}.ics`;
}

function exclusiveEndDate(inclusiveEnd: string): string {
  const [year, month, day] = inclusiveEnd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + 1);
  return utc.toISOString().slice(0, 10);
}

function compactDate(isoDate: string): string {
  return isoDate.replaceAll("-", "");
}

function zoned(date: string, time: string, zone: string): DateTime {
  return DateTime.fromISO(`${date}T${time}`, { zone });
}

function parseDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

function parseTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59;
}

function isTimeZone(zone: string): boolean {
  if (!zone) return false;
  return DateTime.now().setZone(zone).isValid;
}

function escapeIcs(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\n", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}

function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;

  for (const char of Array.from(line)) {
    const size = encoder.encode(char).length;
    if (current && currentBytes + size > limit) {
      parts.push(current);
      current = char;
      currentBytes = size;
      limit = 74;
    } else {
      current += char;
      currentBytes += size;
    }
  }
  if (current) parts.push(current);
  return parts.join("\r\n ");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
