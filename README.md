# Daylink

Create add-to-calendar links for Google Calendar, Outlook, and any app that opens an `.ics` file. The page is static, so it can be hosted for free on [GitHub Pages](https://pages.github.com/). Event details stay in the link. Nothing is stored.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run lint
```

## How the links work

- **Google Calendar** opens `calendar.google.com` with the event filled in. The timezone name is kept, so 10:00 in `America/New_York` stays 10:00 in New York.
- **Outlook.com** is for personal Microsoft accounts.
- **Microsoft 365** is for work and school accounts. Outlook uses two different sites, so there are two links.
- **ICS** is a link back to the download page on this site. Opening it builds a standard calendar file in the browser. Apple Calendar, Thunderbird, and most other apps can open that file.

GitHub Pages cannot generate a file per event on a server. The file is created when someone opens the link. Timed events are written in UTC for Outlook and for the `.ics` file, so they land at the right moment. All-day events include the last day you pick. The generated formats use the usual convention where the technical end date is the following day.

Very long descriptions can push a link past what some email apps will keep. The page warns you when a link crosses about 2,000 characters.

## Publish on GitHub Pages

1. Push this project to a public GitHub repository.
2. Open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes the site on every push to `main`.

The address depends on the repository:

- Project site: `https://<user>.github.io/<repo>/`. The build sees the repository name and sets that base path.
- User site, a repository named `<user>.github.io`: `https://<user>.github.io/`.
- Custom domain: in the workflow `Build` step, set `NEXT_PUBLIC_BASE_PATH` to an empty string so links stay at the domain root.

```yaml
- name: Build
  run: npm run build
  env:
    NEXT_PUBLIC_BASE_PATH: ""
```

## Build the static site yourself

```bash
npm run build
```

The site is written to `out/`. Any static host can serve that folder. If the site will not live at the domain root, set `NEXT_PUBLIC_BASE_PATH` before building, for example `NEXT_PUBLIC_BASE_PATH=/daylink`.
