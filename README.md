# Homeroom Display

A morning-meeting page teachers can project to their classroom. Pick a
seasonal template, drop widgets (date, quote, video, weather, announcements,
to-do, image, custom text) into the slots, and the URL stays the same every
day.

No build step. No dependencies. Open `index.html` in a browser, click **Edit**
in the bottom-right corner, and start customizing.

## Files

| File             | Purpose                                              |
|------------------|------------------------------------------------------|
| `index.html`     | App shell                                            |
| `app.js`         | App loop: load state, render template + widgets      |
| `templates.js`   | 6 templates (Spring, Autumn, Winter, Beach, Forest, Chalkboard) |
| `widgets.js`     | 8 widget modules (each with `render` + `editor`)     |
| `util.js`        | Shared helpers (date math, escapeHtml, daily seed)   |
| `styles.css`     | Base + slot grid + edit chrome + themes              |

## How it works today (no accounts)

- Editor state is saved to **localStorage** on the current device.
- The same URL acts as both the editor and the projection page —
  query string `?mode=edit` shows the toolbar, no query string shows the
  clean projection view.
- Suggested workflow: customize once on your classroom computer, then
  bookmark the URL. Open it each morning, click play on the video, done.

## Deploy

Drag the folder onto [Netlify Drop](https://app.netlify.com/drop). That's it.

## What's still to come (accounts + sync across devices)

The current build is single-device. To let multiple teachers each have their
own page accessible from any device, the next commit will add **Supabase**
(free auth + Postgres):

1. Create a free project at <https://supabase.com>.
2. Provide me the project URL and `anon` public key — I'll wire them in.
3. Run the auto-generated `supabase/schema.sql` (will be created with the
   account commit) in the Supabase SQL editor.
4. Sign-in by magic link, your page lives at `/p/<your-slug>`.

Until then, this app is a perfectly good single-classroom display.

## Customizing widget defaults

Each widget's defaults live near the top of `widgets.js`. Edit
`DEFAULT_QUOTES`, `DEFAULT_VIDEOS`, etc. if you want a different starter set.

## Adding a new widget

In `widgets.js`, define an object with `name`, `description`, `defaults`,
`render(el, config)`, and `editor(el, config, onChange)`. Add it to the
`WIDGETS` registry and to `WIDGET_ORDER`. That's it — the editor UI
auto-picks it up.

## Adding a new template

In `templates.js`, append an object with an `id`, `name`, `themeClass`, a
`grid` (CSS template areas + columns + rows), a `slots` array, and
`defaults`. Add corresponding theme CSS in the **Themes** section of
`styles.css` (background colors, accent color, decorative gradients).
