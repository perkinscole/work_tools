// Templates define: a theme skin, a number of grid columns, and a starting
// widget list. Widgets are an ORDERED ARRAY — order controls grid placement
// and users can reorder, resize, add, and remove them freely in edit mode.

var TEMPLATES = [
  {
    id: "spring",
    name: "Watercolor Spring",
    description: "Soft greens, pinks, and watercolor florals.",
    themeClass: "theme-spring",
    columns: 4,
    defaults: {
      title: "Mr. P's Homeroom",
      widgets: [
        { type: "dateCycle",     config: {}, colspan: 4, rowspan: 1 },
        { type: "announcements", config: {}, colspan: 2, rowspan: 2 },
        { type: "video",         config: {}, colspan: 2, rowspan: 2 },
        { type: "quote",         config: {}, colspan: 4, rowspan: 1 },
      ],
    },
  },
  {
    id: "autumn",
    name: "Cozy Autumn",
    description: "Warm oranges and browns.",
    themeClass: "theme-autumn",
    columns: 3,
    defaults: {
      title: "Good Morning",
      widgets: [
        { type: "dateCycle",     config: {}, colspan: 3, rowspan: 1 },
        { type: "announcements", config: {}, colspan: 1, rowspan: 2 },
        { type: "todo",          config: {}, colspan: 1, rowspan: 2 },
        { type: "weather",       config: {}, colspan: 1, rowspan: 2 },
        { type: "quote",         config: {}, colspan: 3, rowspan: 1 },
      ],
    },
  },
  {
    id: "winter",
    name: "Snowy Winter",
    description: "Cool blues and whites with snowflakes.",
    themeClass: "theme-winter",
    columns: 4,
    defaults: {
      title: "Morning Meeting",
      widgets: [
        { type: "dateCycle",     config: {}, colspan: 4, rowspan: 1 },
        { type: "video",         config: {}, colspan: 2, rowspan: 2 },
        { type: "announcements", config: {}, colspan: 2, rowspan: 1 },
        { type: "quote",         config: {}, colspan: 2, rowspan: 1 },
      ],
    },
  },
  {
    id: "beach",
    name: "Beach Day",
    description: "Teal water, sandy gold, palm motif.",
    themeClass: "theme-beach",
    columns: 2,
    defaults: {
      title: "Aloha, Homeroom!",
      widgets: [
        { type: "dateCycle",     config: {}, colspan: 2, rowspan: 1 },
        { type: "video",         config: {}, colspan: 1, rowspan: 2 },
        { type: "announcements", config: {}, colspan: 1, rowspan: 1 },
        { type: "weather",       config: {}, colspan: 1, rowspan: 1 },
      ],
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep greens and earth tones. Calm.",
    themeClass: "theme-forest",
    columns: 2,
    defaults: {
      title: "Welcome, Class",
      widgets: [
        { type: "dateCycle",     config: {}, colspan: 2, rowspan: 1 },
        { type: "announcements", config: {}, colspan: 1, rowspan: 1 },
        { type: "video",         config: {}, colspan: 1, rowspan: 2 },
        { type: "quote",         config: {}, colspan: 1, rowspan: 1 },
      ],
    },
  },
  {
    id: "chalkboard",
    name: "Chalkboard Classic",
    description: "Dark slate with chalk-style accents.",
    themeClass: "theme-chalkboard",
    columns: 3,
    defaults: {
      title: "Today",
      widgets: [
        { type: "dateCycle",     config: {}, colspan: 3, rowspan: 1 },
        { type: "announcements", config: {}, colspan: 1, rowspan: 2 },
        { type: "todo",          config: {}, colspan: 1, rowspan: 2 },
        { type: "quote",         config: {}, colspan: 1, rowspan: 2 },
      ],
    },
  },
];

function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

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
