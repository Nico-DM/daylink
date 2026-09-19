import { Builder } from "@/components/builder";

export default function HomePage() {
  return (
    <main>
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-12">
        <h1 className="max-w-2xl font-display text-4xl tracking-tight text-balance sm:text-5xl">
          Add to calendar links
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Make a link for Google Calendar, Outlook, or a calendar file. Put it on a
          page, in an email, or in a chat. The event stays in the link, not on a server.
        </p>
      </div>
      <Builder />
      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-12 sm:px-6 sm:grid-cols-3">
        <article>
          <h2 className="text-sm font-medium">Google Calendar</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            A calendar.google.com link. It keeps the timezone you chose, so 10:00 in
            New York stays 10:00 in New York.
          </p>
        </article>
        <article>
          <h2 className="text-sm font-medium">Outlook</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Personal accounts and work accounts use different sites. Outlook.com is
            personal. Microsoft 365 is work and school. Both get the same moment in UTC.
          </p>
        </article>
        <article>
          <h2 className="text-sm font-medium">ICS file</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Apple Calendar and most other apps open a standard .ics file. The link
            points back here and the file is built in the browser, which is what a
            free static host can do.
          </p>
        </article>
      </section>
    </main>
  );
}
