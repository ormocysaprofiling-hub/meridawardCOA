# Parish Calendar — Church Activity Scheduler

A lightweight, static web app for scheduling church/organization activities and printing a clean, ready-to-share bulletin (or "Save as PDF" from any browser's print dialog).

No build tools, no dependencies, no backend — just three files.

## Features

- Add activities with:
  - **Activity Date**
  - **Activity Name**
  - **Theme**
  - **Description**
  - **Type of Activity** — Devotional, Physical, Fellowship, Outreach, Educational, Service, or a custom "Other" type
- Edit or delete any entry
- **List view** grouped by month, and a **Calendar (grid) view**
- Filter the schedule by activity type
- **Print / Save as PDF** button — reformats the schedule into a clean printable bulletin and hides all the editing controls
- Everything is saved automatically in the browser (`localStorage`) — no account or server needed

## Getting started

### Option 1 — Just open it
Download the repo and open `index.html` directly in your browser. That's it.

### Option 2 — Host it on GitHub Pages
1. Push these files to a GitHub repository.
2. Go to **Settings → Pages**.
3. Under **Source**, choose the branch (usually `main`) and root folder.
4. Save — GitHub will give you a live URL (e.g. `https://yourusername.github.io/your-repo/`).

Share that link with your team so everyone can add activities from the same device, or have one person maintain the schedule and print/export it for the bulletin each week.

## Printing to PDF

1. Click **Print / Save PDF** in the app (or use your browser's normal print shortcut, `Ctrl/Cmd + P`).
2. In the print dialog, choose **Save as PDF** as the destination.
3. The printed version automatically switches to a clean list layout with a title header and hides all buttons/forms.

## File structure

```
church-scheduler/
├── index.html   — page structure & form
├── style.css    — styling + print stylesheet
├── script.js    — app logic (add/edit/delete, list & calendar rendering, filters)
└── README.md
```

## Notes on data storage

Activities are stored in the browser's `localStorage`, scoped to the device/browser you're using. This means:
- Data persists between visits on the same browser.
- It does **not** sync across devices or team members automatically.
- If you need a shared, multi-user calendar, you'd want to swap `localStorage` for a small backend or a service like Google Sheets/Firebase — happy to help extend it that way if needed.

## Customizing

- **Colors/fonts**: edit the `:root` variables at the top of `style.css`.
- **Activity types**: edit the `<select id="type">` options in `index.html` (and the matching CSS color rules for `.chip`, `.activity-card`, `.cal-pill` if you want each type to have its own color).
