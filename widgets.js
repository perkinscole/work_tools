// Widget registry. Each widget exports defaults + render() + editor().
// render(el, config) paints view-mode UI into `el`.
// editor(el, config, onChange) paints the config form. Call onChange(next)
// after every edit so the page can save + re-render.

import {
  parseISODate,
  startOfWeekMonday,
  daysBetween,
  ordinal,
  dailyIndex,
  escapeHtml,
} from "./util.js";

/* -------------------------------------------------------------------- */
/* Date / Cycle                                                          */
/* -------------------------------------------------------------------- */

const dateCycle = {
  name: "Date & Cycle",
  description: "Today's date and which day of a rotating cycle (A/B, A/B/C, etc.).",
  defaults: {
    anchorDate: "2025-09-02",
    anchorLabel: "A",
    cycleLabels: ["A", "B", "C"],
  },
  render(el, config) {
    const today = new Date();
    const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const months = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];
    const line = `${weekdays[today.getDay()]} ${months[today.getMonth()]} ${ordinal(today.getDate())}, ${today.getFullYear()}`;
    let cycle = "";
    try {
      const anchor = startOfWeekMonday(parseISODate(config.anchorDate));
      const thisMonday = startOfWeekMonday(today);
      const weeksDiff = Math.round(daysBetween(anchor, thisMonday) / 7);
      const labels = config.cycleLabels;
      const anchorIdx = labels.indexOf(config.anchorLabel);
      if (anchorIdx >= 0 && labels.length > 0) {
        const idx = (((anchorIdx + weeksDiff) % labels.length) + labels.length) % labels.length;
        cycle = `<span class="cycle-pill">Week ${escapeHtml(labels[idx])}</span>`;
      }
    } catch { /* ignore bad config */ }
    el.innerHTML = `<div class="date-line">${escapeHtml(line)} ${cycle}</div>`;
  },
  editor(el, config, onChange) {
    el.innerHTML = `
      <label>Cycle labels (comma-separated)
        <input type="text" data-k="cycleLabels" value="${escapeHtml(config.cycleLabels.join(", "))}" />
      </label>
      <label>Anchor Monday date (YYYY-MM-DD)
        <input type="date" data-k="anchorDate" value="${escapeHtml(config.anchorDate)}" />
      </label>
      <label>Label for that anchor week
        <input type="text" data-k="anchorLabel" value="${escapeHtml(config.anchorLabel)}" />
      </label>
      <p class="hint">No cycle? Set labels to a single value or leave blank.</p>
    `;
    el.querySelectorAll("input").forEach((inp) => {
      inp.addEventListener("change", () => {
        const next = { ...config };
        const k = inp.dataset.k;
        if (k === "cycleLabels") {
          next.cycleLabels = inp.value.split(",").map((s) => s.trim()).filter(Boolean);
        } else {
          next[k] = inp.value;
        }
        onChange(next);
      });
    });
  },
};

/* -------------------------------------------------------------------- */
/* Quote of the Day                                                      */
/* -------------------------------------------------------------------- */

const DEFAULT_QUOTES = [
  { text: "The best way out is always through.", author: "Robert Frost" },
  { text: "Be kind whenever possible. It is always possible.", author: "Dalai Lama" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Try to be a rainbow in someone else's cloud.", author: "Maya Angelou" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
];

const quote = {
  name: "Quote of the Day",
  description: "Rotates daily through your list. Click shuffle to pick another.",
  defaults: { quotes: DEFAULT_QUOTES, salt: 0 },
  render(el, config) {
    const quotes = config.quotes && config.quotes.length ? config.quotes : DEFAULT_QUOTES;
    const idx = dailyIndex(new Date(), quotes.length, config.salt || 0);
    const q = quotes[idx];
    el.innerHTML = `
      <blockquote>
        <p>&ldquo;${escapeHtml(q.text)}&rdquo;</p>
        <footer>&mdash; ${escapeHtml(q.author || "Unknown")}</footer>
      </blockquote>
      <button class="shuffle-btn" type="button">shuffle</button>
    `;
    el.querySelector(".shuffle-btn").addEventListener("click", () => {
      el.dispatchEvent(new CustomEvent("widget-shuffle", { bubbles: true }));
    });
  },
  editor(el, config, onChange) {
    const lines = (config.quotes || DEFAULT_QUOTES)
      .map((q) => `${q.text} | ${q.author || ""}`).join("\n");
    el.innerHTML = `
      <label>Quotes (one per line, use <code>|</code> to separate text from author)
        <textarea rows="8" data-k="quotes">${escapeHtml(lines)}</textarea>
      </label>
    `;
    el.querySelector("textarea").addEventListener("change", (e) => {
      const parsed = e.target.value.split("\n").map((line) => {
        const [text, author] = line.split("|").map((s) => (s || "").trim());
        return text ? { text, author: author || "Unknown" } : null;
      }).filter(Boolean);
      onChange({ ...config, quotes: parsed, salt: 0 });
    });
  },
};

/* -------------------------------------------------------------------- */
/* Relaxing Video                                                        */
/* -------------------------------------------------------------------- */

const DEFAULT_VIDEOS = [
  { id: "BHACKCNDMW8", title: "Flying Over Hawaii (4K)" },
  { id: "lM02vNMRRB0", title: "Forest 4K Nature" },
  { id: "qH5kP05kKfM", title: "Aerial Norway (4K)" },
  { id: "eKFTSSKCzWA", title: "Peaceful Piano" },
  { id: "DWcJFNfaw9c", title: "Relaxing Jazz" },
];

const video = {
  name: "Relaxing Video",
  description: "Embeds a YouTube video, rotated daily. Shuffle picks another.",
  defaults: { videos: DEFAULT_VIDEOS, salt: 0 },
  render(el, config) {
    const videos = config.videos && config.videos.length ? config.videos : DEFAULT_VIDEOS;
    const idx = dailyIndex(new Date(), videos.length, config.salt || 0);
    const v = videos[idx];
    const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0&modestbranding=1`;
    el.innerHTML = `
      <div class="video-frame">
        <iframe src="${src}" title="${escapeHtml(v.title || "Video")}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen></iframe>
      </div>
      <button class="shuffle-btn" type="button">shuffle</button>
    `;
    el.querySelector(".shuffle-btn").addEventListener("click", () => {
      el.dispatchEvent(new CustomEvent("widget-shuffle", { bubbles: true }));
    });
  },
  editor(el, config, onChange) {
    const lines = (config.videos || DEFAULT_VIDEOS)
      .map((v) => `${v.id} | ${v.title || ""}`).join("\n");
    el.innerHTML = `
      <label>Videos (one per line: <code>YOUTUBE_ID | title</code>)
        <textarea rows="6" data-k="videos">${escapeHtml(lines)}</textarea>
      </label>
      <p class="hint">To get the ID, copy the part after <code>v=</code> in the YouTube URL.</p>
    `;
    el.querySelector("textarea").addEventListener("change", (e) => {
      const parsed = e.target.value.split("\n").map((line) => {
        const [id, title] = line.split("|").map((s) => (s || "").trim());
        return id ? { id, title: title || id } : null;
      }).filter(Boolean);
      onChange({ ...config, videos: parsed, salt: 0 });
    });
  },
};

/* -------------------------------------------------------------------- */
/* Announcements                                                         */
/* -------------------------------------------------------------------- */

const announcements = {
  name: "Announcements",
  description: "Bulleted list of reminders.",
  defaults: { title: "Reminders", items: ["Welcome back!"] },
  render(el, config) {
    el.innerHTML = `
      <h3 class="widget-title">${escapeHtml(config.title || "Reminders")}</h3>
      <ul class="bullet-list">
        ${(config.items || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
      </ul>
    `;
  },
  editor(el, config, onChange) {
    el.innerHTML = `
      <label>Header
        <input type="text" data-k="title" value="${escapeHtml(config.title || "Reminders")}" />
      </label>
      <label>Items (one per line)
        <textarea rows="8" data-k="items">${escapeHtml((config.items || []).join("\n"))}</textarea>
      </label>
    `;
    el.querySelector('[data-k="title"]').addEventListener("change", (e) => {
      onChange({ ...config, title: e.target.value });
    });
    el.querySelector('[data-k="items"]').addEventListener("change", (e) => {
      onChange({ ...config, items: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) });
    });
  },
};

/* -------------------------------------------------------------------- */
/* To-Do / Agenda                                                        */
/* -------------------------------------------------------------------- */

const todo = {
  name: "To-Do / Agenda",
  description: "Checkable list. Checks are saved locally on this device.",
  defaults: { title: "Today's Agenda", items: ["Bell work", "Notebook check", "Pack up at 2:55"] },
  render(el, config) {
    const storageKey = `todo-checks-${(config.title || "agenda").toLowerCase().replace(/\s+/g, "-")}`;
    const today = new Date().toISOString().slice(0, 10);
    let store = {};
    try { store = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { /* ignore */ }
    if (store.date !== today) store = { date: today, checks: {} };

    el.innerHTML = `
      <h3 class="widget-title">${escapeHtml(config.title || "Today")}</h3>
      <ul class="todo-list">
        ${(config.items || []).map((s, i) => `
          <li>
            <label>
              <input type="checkbox" data-i="${i}" ${store.checks[i] ? "checked" : ""} />
              <span>${escapeHtml(s)}</span>
            </label>
          </li>
        `).join("")}
      </ul>
    `;
    el.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        store.checks[cb.dataset.i] = cb.checked;
        localStorage.setItem(storageKey, JSON.stringify(store));
      });
    });
  },
  editor(el, config, onChange) {
    el.innerHTML = `
      <label>Header
        <input type="text" data-k="title" value="${escapeHtml(config.title || "Today")}" />
      </label>
      <label>Items (one per line)
        <textarea rows="8" data-k="items">${escapeHtml((config.items || []).join("\n"))}</textarea>
      </label>
      <p class="hint">Checkboxes reset each new day.</p>
    `;
    el.querySelector('[data-k="title"]').addEventListener("change", (e) => {
      onChange({ ...config, title: e.target.value });
    });
    el.querySelector('[data-k="items"]').addEventListener("change", (e) => {
      onChange({ ...config, items: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) });
    });
  },
};

/* -------------------------------------------------------------------- */
/* Weather                                                               */
/* -------------------------------------------------------------------- */

const WEATHER_ICON = {
  0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Foggy",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Rain showers", 81: "Rain showers", 82: "Heavy showers",
  95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
};

const weather = {
  name: "Weather",
  description: "Live local weather via Open-Meteo (no API key needed).",
  defaults: { latitude: 42.3601, longitude: -71.0589, label: "Boston, MA", unit: "fahrenheit" },
  render(el, config) {
    el.innerHTML = `<div class="weather-loading">Loading weather&hellip;</div>`;
    const unit = config.unit === "celsius" ? "celsius" : "fahrenheit";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(config.latitude)}&longitude=${encodeURIComponent(config.longitude)}&current=temperature_2m,weather_code&temperature_unit=${unit}`;
    fetch(url).then((r) => r.json()).then((data) => {
      const c = data.current;
      if (!c) throw new Error("no data");
      const u = unit === "celsius" ? "&deg;C" : "&deg;F";
      el.innerHTML = `
        <h3 class="widget-title">${escapeHtml(config.label || "Weather")}</h3>
        <div class="weather-big">${Math.round(c.temperature_2m)}${u}</div>
        <div class="weather-desc">${escapeHtml(WEATHER_ICON[c.weather_code] || "—")}</div>
      `;
    }).catch(() => {
      el.innerHTML = `<div class="weather-error">Weather unavailable.</div>`;
    });
  },
  editor(el, config, onChange) {
    el.innerHTML = `
      <label>Location label
        <input type="text" data-k="label" value="${escapeHtml(config.label || "")}" />
      </label>
      <label>Latitude
        <input type="number" step="0.0001" data-k="latitude" value="${escapeHtml(String(config.latitude))}" />
      </label>
      <label>Longitude
        <input type="number" step="0.0001" data-k="longitude" value="${escapeHtml(String(config.longitude))}" />
      </label>
      <label>Units
        <select data-k="unit">
          <option value="fahrenheit" ${config.unit !== "celsius" ? "selected" : ""}>Fahrenheit</option>
          <option value="celsius" ${config.unit === "celsius" ? "selected" : ""}>Celsius</option>
        </select>
      </label>
      <p class="hint">Find lat/long by searching your city on Google Maps and right-clicking.</p>
    `;
    el.querySelectorAll("input, select").forEach((inp) => {
      inp.addEventListener("change", () => {
        const next = { ...config };
        if (inp.dataset.k === "latitude" || inp.dataset.k === "longitude") {
          next[inp.dataset.k] = parseFloat(inp.value);
        } else {
          next[inp.dataset.k] = inp.value;
        }
        onChange(next);
      });
    });
  },
};

/* -------------------------------------------------------------------- */
/* Image                                                                 */
/* -------------------------------------------------------------------- */

const imageWidget = {
  name: "Image",
  description: "Show a single image — a seating chart, classroom photo, etc.",
  defaults: { url: "", caption: "", fit: "contain" },
  render(el, config) {
    if (!config.url) {
      el.innerHTML = `<div class="empty-state">No image set. Edit this widget to add one.</div>`;
      return;
    }
    el.innerHTML = `
      <img src="${escapeHtml(config.url)}" alt="${escapeHtml(config.caption || "")}"
        style="object-fit:${config.fit === "cover" ? "cover" : "contain"}" />
      ${config.caption ? `<div class="image-caption">${escapeHtml(config.caption)}</div>` : ""}
    `;
  },
  editor(el, config, onChange) {
    el.innerHTML = `
      <label>Image URL
        <input type="url" data-k="url" value="${escapeHtml(config.url || "")}" placeholder="https://..." />
      </label>
      <label>Caption (optional)
        <input type="text" data-k="caption" value="${escapeHtml(config.caption || "")}" />
      </label>
      <label>Fit
        <select data-k="fit">
          <option value="contain" ${config.fit !== "cover" ? "selected" : ""}>Contain (whole image)</option>
          <option value="cover" ${config.fit === "cover" ? "selected" : ""}>Cover (fill the slot)</option>
        </select>
      </label>
      <p class="hint">Paste any public image URL. To use a file from your computer, upload it to Google Drive or Imgur first and use the public URL.</p>
    `;
    el.querySelectorAll("input, select").forEach((inp) => {
      inp.addEventListener("change", () => {
        onChange({ ...config, [inp.dataset.k]: inp.value });
      });
    });
  },
};

/* -------------------------------------------------------------------- */
/* Custom Text                                                           */
/* -------------------------------------------------------------------- */

const customText = {
  name: "Custom Text",
  description: "A free-form block of text — sub plans, fire drill info, anything.",
  defaults: { title: "", body: "Write anything here." },
  render(el, config) {
    el.innerHTML = `
      ${config.title ? `<h3 class="widget-title">${escapeHtml(config.title)}</h3>` : ""}
      <div class="custom-text-body">${escapeHtml(config.body || "").replace(/\n/g, "<br>")}</div>
    `;
  },
  editor(el, config, onChange) {
    el.innerHTML = `
      <label>Title (optional)
        <input type="text" data-k="title" value="${escapeHtml(config.title || "")}" />
      </label>
      <label>Body
        <textarea rows="8" data-k="body">${escapeHtml(config.body || "")}</textarea>
      </label>
    `;
    el.querySelectorAll("input, textarea").forEach((inp) => {
      inp.addEventListener("change", () => {
        onChange({ ...config, [inp.dataset.k]: inp.value });
      });
    });
  },
};

/* -------------------------------------------------------------------- */
/* Registry                                                              */
/* -------------------------------------------------------------------- */

export const WIDGETS = {
  dateCycle,
  quote,
  video,
  announcements,
  todo,
  weather,
  image: imageWidget,
  customText,
};

export const WIDGET_ORDER = [
  "dateCycle", "announcements", "quote", "video",
  "todo", "weather", "image", "customText",
];

export function getWidget(type) {
  return WIDGETS[type] || null;
}
