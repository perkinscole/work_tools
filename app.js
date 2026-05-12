/* ============================================================
 * Mr. P's Homeroom — Morning Page
 * Edit CONFIG below to customize the cycle anchor, quotes,
 * and relaxing video list. Announcements + title are edited
 * in-page (click "edit" or click the title) and persist in
 * your browser via localStorage.
 * ============================================================ */

const CONFIG = {
  // -- Week cycle --------------------------------------------------------
  // The week containing CYCLE_ANCHOR_DATE is the cycle labeled
  // CYCLE_ANCHOR_LABEL. Weeks roll over each Monday.
  // Today (Tue May 12, 2026) is Week B, so anchor that Monday to "B".
  CYCLE_ANCHOR_DATE: "2026-05-11", // a Monday
  CYCLE_ANCHOR_LABEL: "B",
  CYCLE_LABELS: ["A", "B", "C"],

  // -- Quotes ------------------------------------------------------------
  QUOTES: [
    { text: "Insecurity is a waste of time.", author: "Diane von Furstenberg" },
    { text: "The best way out is always through.", author: "Robert Frost" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
    { text: "Be kind whenever possible. It is always possible.", author: "Dalai Lama" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
    { text: "Try to be a rainbow in someone else's cloud.", author: "Maya Angelou" },
    { text: "If you can dream it, you can do it.", author: "Walt Disney" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
    { text: "Whether you think you can, or you think you can't — you're right.", author: "Henry Ford" },
    { text: "It is never too late to be what you might have been.", author: "George Eliot" },
    { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
    { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "Yesterday is history, tomorrow is a mystery, today is a gift.", author: "Eleanor Roosevelt" },
    { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
    { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
    { text: "Everything you can imagine is real.", author: "Pablo Picasso" },
    { text: "What we think, we become.", author: "Buddha" },
    { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
    { text: "The mind is everything. What you think you become.", author: "Buddha" },
    { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
    { text: "Limit your 'always' and your 'nevers.'", author: "Amy Poehler" },
    { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
    { text: "If you're going through hell, keep going.", author: "Winston Churchill" },
    { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
    { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
    { text: "Act as if what you do makes a difference. It does.", author: "William James" },
    { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
    { text: "Tough times never last, but tough people do.", author: "Robert H. Schuller" }
  ],

  // -- Relaxing videos (YouTube embed IDs) -------------------------------
  // To add: copy a video's ID from the URL (the part after v=) and add it
  // here. Verify the video allows embedding.
  VIDEOS: [
    { id: "BHACKCNDMW8", title: "Flying Over Hawaii (4K)" },
    { id: "1ZYbU82GVz4", title: "Beautiful Relaxing Music" },
    { id: "qH5kP05kKfM", title: "Aerial Norway (4K)" },
    { id: "lM02vNMRRB0", title: "Forest 4K Nature" },
    { id: "eKFTSSKCzWA", title: "Peaceful Piano Music" },
    { id: "DWcJFNfaw9c", title: "Relaxing Jazz" },
    { id: "5qap5aO4i9A", title: "Lofi Hip Hop Radio" }
  ]
};

/* =====================================================================
 * Helpers
 * ===================================================================== */

function pad2(n) { return String(n).padStart(2, "0"); }

function parseISODate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeekMonday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = d.getDay(); // 0 Sun .. 6 Sat
  const offset = (dow + 6) % 7; // days since Monday
  d.setDate(d.getDate() - offset);
  return d;
}

function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((b - a) / MS);
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / (24 * 60 * 60 * 1000));
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* Computus — Gregorian Easter Sunday */
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function nthWeekdayOfMonth(year, month, weekday, n) {
  // month 0-indexed; weekday 0=Sun..6=Sat; n=1..5
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

/* =====================================================================
 * Cycle (A/B/C)
 * ===================================================================== */

function getCycleLabel(date) {
  const anchor = startOfWeekMonday(parseISODate(CONFIG.CYCLE_ANCHOR_DATE));
  const thisMonday = startOfWeekMonday(date);
  const weeksDiff = Math.round(daysBetween(anchor, thisMonday) / 7);
  const labels = CONFIG.CYCLE_LABELS;
  const anchorIdx = labels.indexOf(CONFIG.CYCLE_ANCHOR_LABEL);
  const idx = (((anchorIdx + weeksDiff) % labels.length) + labels.length) % labels.length;
  return labels[idx];
}

/* =====================================================================
 * Theme detection
 * ===================================================================== */

function detectTheme(date) {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed
  const d = date.getDate();

  // Holidays (window around the day so the theme lasts a few days)
  const holidays = [
    { name: "newyear",     start: new Date(y, 11, 28), end: new Date(y + 1, 0, 2) },
    { name: "newyear",     start: new Date(y - 1, 11, 28), end: new Date(y, 0, 2) },
    { name: "valentines",  start: new Date(y, 1, 10),  end: new Date(y, 1, 15) },
    { name: "stpatricks",  start: new Date(y, 2, 14),  end: new Date(y, 2, 18) },
    { name: "independence",start: new Date(y, 6, 1),   end: new Date(y, 6, 5)  },
    { name: "halloween",   start: new Date(y, 9, 20),  end: new Date(y, 9, 31) },
    { name: "thanksgiving",start: (() => {
        const t = nthWeekdayOfMonth(y, 10, 4, 4); // 4th Thursday of November
        return new Date(t.getFullYear(), t.getMonth(), t.getDate() - 3);
      })(),
      end: (() => {
        const t = nthWeekdayOfMonth(y, 10, 4, 4);
        return new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
      })() },
    { name: "christmas",   start: new Date(y, 11, 10), end: new Date(y, 11, 27) }
  ];

  for (const h of holidays) {
    if (date >= h.start && date <= h.end) return h.name;
  }

  // Seasons (meteorological)
  if (m === 11 || m <= 1) return "winter";
  if (m >= 2 && m <= 4)   return "spring";
  if (m >= 5 && m <= 7)   return "summer";
  return "fall";
}

const THEME_LABELS = {
  spring: "Spring",
  summer: "Summer",
  fall: "Autumn",
  winter: "Winter",
  valentines: "Valentine's Day",
  stpatricks: "St. Patrick's Day",
  independence: "Independence Day",
  halloween: "Halloween",
  thanksgiving: "Thanksgiving",
  christmas: "Christmas",
  newyear: "New Year"
};

/* =====================================================================
 * Daily picks — deterministic by date, reshufflable
 * ===================================================================== */

function dailyIndex(date, listLength, salt = 0) {
  // Stable per-day pseudo-random index.
  const key = date.getFullYear() * 1000 + dayOfYear(date) + salt * 7919;
  // simple LCG-ish hash
  let h = key;
  h = (h ^ 61) ^ (h >>> 16);
  h = h + (h << 3);
  h = h ^ (h >>> 4);
  h = Math.imul(h, 0x27d4eb2d);
  h = h ^ (h >>> 15);
  return Math.abs(h) % listLength;
}

/* =====================================================================
 * Persistence
 * ===================================================================== */

const STORAGE_KEY = "mrp-homeroom-v1";

function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveStore(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { /* ignore */ }
}
function getStored(key) { return loadStore()[key]; }
function setStored(key, value) {
  const s = loadStore();
  s[key] = value;
  saveStore(s);
}

/* =====================================================================
 * Render
 * ===================================================================== */

const state = {
  date: new Date(),
  quoteSalt: 0,
  videoSalt: 0
};

function renderDate() {
  const d = state.date;
  const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  const line = `${weekdays[d.getDay()]} ${months[d.getMonth()]} ${ordinal(d.getDate())}, ${d.getFullYear()}`;
  const cycle = getCycleLabel(d);
  document.getElementById("date-line").innerHTML =
    `${line} <span class="cycle-pill">Week ${cycle}</span>`;
}

function renderQuote() {
  const idx = dailyIndex(state.date, CONFIG.QUOTES.length, state.quoteSalt);
  const q = CONFIG.QUOTES[idx];
  document.getElementById("quote-text").textContent = `“${q.text}”`;
  document.getElementById("quote-author").textContent = q.author;
}

function renderVideo() {
  const idx = dailyIndex(state.date, CONFIG.VIDEOS.length, state.videoSalt);
  const v = CONFIG.VIDEOS[idx];
  const iframe = document.getElementById("video-iframe");
  const src = `https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1`;
  if (iframe.dataset.src !== src) {
    iframe.dataset.src = src;
    iframe.src = src;
    iframe.title = v.title;
  }
}

function renderTheme() {
  const theme = detectTheme(state.date);
  document.body.dataset.theme = theme;
  document.getElementById("theme-label").textContent = `Theme: ${THEME_LABELS[theme] || theme}`;
}

function renderAll() {
  renderDate();
  renderTheme();
  renderQuote();
  renderVideo();
}

/* =====================================================================
 * Editable fields (announcements, title)
 * ===================================================================== */

function setupEditable() {
  // Title
  const title = document.querySelector('[data-storage="title"]');
  const storedTitle = getStored("title");
  if (storedTitle) title.textContent = storedTitle;
  title.addEventListener("blur", () => setStored("title", title.textContent.trim()));

  // Announcements (toggle edit mode)
  const ann = document.getElementById("announcements");
  const storedAnn = getStored("announcements");
  if (storedAnn) ann.innerHTML = storedAnn;

  const editBtn = document.getElementById("edit-announcements");
  editBtn.addEventListener("click", () => {
    const editing = ann.getAttribute("contenteditable") === "true";
    if (editing) {
      ann.setAttribute("contenteditable", "false");
      editBtn.classList.remove("active");
      editBtn.textContent = "edit";
      setStored("announcements", ann.innerHTML);
    } else {
      ann.setAttribute("contenteditable", "true");
      editBtn.classList.add("active");
      editBtn.textContent = "done";
      ann.focus();
    }
  });

  // Convert Enter inside the list into a new <li>
  ann.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && ann.getAttribute("contenteditable") === "true") {
      // Browsers usually do this for us inside a UL; leave default.
    }
  });
}

/* =====================================================================
 * Wire-up
 * ===================================================================== */

function setupShuffleButtons() {
  document.getElementById("shuffle-quote").addEventListener("click", () => {
    state.quoteSalt += 1;
    renderQuote();
  });
  document.getElementById("shuffle-video").addEventListener("click", () => {
    state.videoSalt += 1;
    renderVideo();
  });
}

function scheduleMidnightRefresh() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  setTimeout(() => {
    state.date = new Date();
    state.quoteSalt = 0;
    state.videoSalt = 0;
    renderAll();
    scheduleMidnightRefresh();
  }, next - now);
}

document.addEventListener("DOMContentLoaded", () => {
  setupEditable();
  setupShuffleButtons();
  renderAll();
  scheduleMidnightRefresh();
});
