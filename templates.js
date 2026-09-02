// Template registry. Each template defines a CSS grid layout (named areas),
// a theme class applied to <body>, and which slot ids it exposes.

var TEMPLATES = [
  {
    id: "spring",
    name: "Watercolor Spring",
    description: "Soft greens, pinks, and watercolor florals.",
    themeClass: "theme-spring",
    grid: {
      areas: `"header header"
              "a b"
              "c c"`,
      columns: "1fr 1fr",
      rows: "auto 1fr auto",
    },
    slots: [
      { id: "header", label: "Header strip" },
      { id: "a", label: "Left panel" },
      { id: "b", label: "Right panel" },
      { id: "c", label: "Bottom panel" },
    ],
    defaults: {
      title: "Mr. P's Homeroom",
      widgets: {
        header: { type: "dateCycle", config: {} },
        a: { type: "announcements", config: {} },
        b: { type: "video", config: {} },
        c: { type: "quote", config: {} },
      },
    },
  },
  {
    id: "autumn",
    name: "Cozy Autumn",
    description: "Warm oranges and browns. Falling leaves.",
    themeClass: "theme-autumn",
    grid: {
      areas: `"header header header"
              "a b c"
              "d d d"`,
      columns: "1fr 1fr 1fr",
      rows: "auto 1fr auto",
    },
    slots: [
      { id: "header", label: "Header strip" },
      { id: "a", label: "Column 1" },
      { id: "b", label: "Column 2" },
      { id: "c", label: "Column 3" },
      { id: "d", label: "Bottom panel" },
    ],
    defaults: {
      title: "Good Morning",
      widgets: {
        header: { type: "dateCycle", config: {} },
        a: { type: "announcements", config: {} },
        b: { type: "todo", config: {} },
        c: { type: "weather", config: {} },
        d: { type: "quote", config: {} },
      },
    },
  },
  {
    id: "winter",
    name: "Snowy Winter",
    description: "Cool blues and whites with snowflakes.",
    themeClass: "theme-winter",
    grid: {
      areas: `"header header"
              "a a"
              "b c"`,
      columns: "1fr 1fr",
      rows: "auto auto 1fr",
    },
    slots: [
      { id: "header", label: "Header strip" },
      { id: "a", label: "Wide middle" },
      { id: "b", label: "Bottom left" },
      { id: "c", label: "Bottom right" },
    ],
    defaults: {
      title: "Morning Meeting",
      widgets: {
        header: { type: "dateCycle", config: {} },
        a: { type: "video", config: {} },
        b: { type: "announcements", config: {} },
        c: { type: "quote", config: {} },
      },
    },
  },
  {
    id: "beach",
    name: "Beach Day",
    description: "Teal water, sandy gold, palm motif.",
    themeClass: "theme-beach",
    grid: {
      areas: `"header header"
              "a b"
              "a c"`,
      columns: "1fr 1fr",
      rows: "auto 1fr 1fr",
    },
    slots: [
      { id: "header", label: "Header strip" },
      { id: "a", label: "Tall left" },
      { id: "b", label: "Top right" },
      { id: "c", label: "Bottom right" },
    ],
    defaults: {
      title: "Aloha, Homeroom!",
      widgets: {
        header: { type: "dateCycle", config: {} },
        a: { type: "video", config: {} },
        b: { type: "announcements", config: {} },
        c: { type: "weather", config: {} },
      },
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep greens and earth tones. Calm.",
    themeClass: "theme-forest",
    grid: {
      areas: `"header header"
              "a b"
              "c b"`,
      columns: "1fr 1fr",
      rows: "auto 1fr 1fr",
    },
    slots: [
      { id: "header", label: "Header strip" },
      { id: "a", label: "Top left" },
      { id: "b", label: "Tall right" },
      { id: "c", label: "Bottom left" },
    ],
    defaults: {
      title: "Welcome, Class",
      widgets: {
        header: { type: "dateCycle", config: {} },
        a: { type: "announcements", config: {} },
        b: { type: "video", config: {} },
        c: { type: "quote", config: {} },
      },
    },
  },
  {
    id: "chalkboard",
    name: "Chalkboard Classic",
    description: "Dark slate with chalk-style accents.",
    themeClass: "theme-chalkboard",
    grid: {
      areas: `"header header header"
              "a b c"`,
      columns: "1fr 1fr 1fr",
      rows: "auto 1fr",
    },
    slots: [
      { id: "header", label: "Header strip" },
      { id: "a", label: "Column 1" },
      { id: "b", label: "Column 2" },
      { id: "c", label: "Column 3" },
    ],
    defaults: {
      title: "Today",
      widgets: {
        header: { type: "dateCycle", config: {} },
        a: { type: "announcements", config: {} },
        b: { type: "todo", config: {} },
        c: { type: "quote", config: {} },
      },
    },
  },
];

function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

// Themes: separate from templates (layouts). "auto" means use the current
// template's bundled themeClass; the rest override the visual skin
// independent of layout.
var THEMES = [
  { id: "auto",         name: "Auto (from template)", className: null },
  { id: "spring",       name: "Watercolor Spring",    className: "theme-spring" },
  { id: "summer",       name: "Sunny Summer",         className: "theme-summer" },
  { id: "autumn",       name: "Cozy Autumn",          className: "theme-autumn" },
  { id: "winter",       name: "Snowy Winter",         className: "theme-winter" },
  { id: "beach",        name: "Beach Day",            className: "theme-beach" },
  { id: "forest",       name: "Forest",               className: "theme-forest" },
  { id: "chalkboard",   name: "Chalkboard",           className: "theme-chalkboard" },
  { id: "valentines",   name: "Valentine's Day",      className: "theme-valentines" },
  { id: "stpatricks",   name: "St. Patrick's Day",    className: "theme-stpatricks" },
  { id: "independence", name: "Independence Day",     className: "theme-independence" },
  { id: "halloween",    name: "Halloween",            className: "theme-halloween" },
  { id: "thanksgiving", name: "Thanksgiving",         className: "theme-thanksgiving" },
  { id: "christmas",    name: "Christmas",            className: "theme-christmas" },
  { id: "newyear",      name: "New Year",             className: "theme-newyear" },
];

function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
