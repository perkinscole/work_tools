// Homeroom Display — app shell.
//
// State shape (v4):
//   { templateId, themeId, title, widgets: [ ... ] }
// Each widget: { id, type, config, colspan, rowspan, fontScale }
//
// The grid is fluid: columns come from the template, each widget picks its
// own colspan/rowspan, and widgets flow with grid-auto-flow: dense so
// removing one actually frees the space it occupied.

/* Depends on globals from templates.js (TEMPLATES, getTemplate, THEMES,
 * getTheme) and widgets.js (WIDGETS, WIDGET_ORDER, getWidget). */

const STORAGE_KEY = "homeroom-display-v4";

/* -------------------------------------------------------------------- */
/* State                                                                 */
/* -------------------------------------------------------------------- */

function newWidgetId() {
  return "w-" + Math.random().toString(36).slice(2, 10);
}

function defaultState() {
  const tpl = TEMPLATES[0];
  return {
    templateId: tpl.id,
    themeId: "auto",
    title: tpl.defaults.title,
    widgets: tpl.defaults.widgets.map((w) => ({
      id: newWidgetId(),
      fontScale: "normal",
      ...w,
      config: deepClone(w.config || {}),
    })),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.templateId || !Array.isArray(parsed.widgets)) {
      return defaultState();
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* ignore */ }
}

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

function fillDefaults(state) {
  // Make sure every widget has required layout fields and an id.
  state.widgets = (state.widgets || []).map((w) => ({
    id: w.id || newWidgetId(),
    type: w.type,
    config: w.config || {},
    colspan: w.colspan || 1,
    rowspan: w.rowspan || 1,
    fontScale: w.fontScale || "normal",
  })).filter((w) => w.type && getWidget(w.type));
  return state;
}

function effectiveConfig(widget) {
  const def = widget && widget.type ? getWidget(widget.type) : null;
  if (!def) return (widget && widget.config) || {};
  return { ...def.defaults, ...(widget.config || {}) };
}

/* -------------------------------------------------------------------- */
/* Render                                                                */
/* -------------------------------------------------------------------- */

let state = fillDefaults(loadState());
let mode = new URLSearchParams(location.search).get("mode") === "edit" ? "edit" : "view";

function persist() { saveState(state); }

function renderTheme() {
  const tpl = getTemplate(state.templateId);
  const themeOverride = getTheme(state.themeId || "auto");
  const themeClass = themeOverride.className || tpl.themeClass;
  document.body.className = `${themeClass} mode-${mode}`;
}

function renderHeader() {
  document.getElementById("page-title").textContent = state.title || "";
}

function renderToolbar() {
  document.getElementById("toolbar").hidden = mode !== "edit";
  document.getElementById("toggle-mode").textContent = mode === "edit" ? "Done (view)" : "Edit";

  const sel = document.getElementById("template-picker");
  if (!sel.options.length) {
    for (const t of TEMPLATES) {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      sel.appendChild(opt);
    }
  }
  sel.value = state.templateId;
  document.getElementById("template-desc").textContent = getTemplate(state.templateId).description;

  const themeSel = document.getElementById("theme-picker");
  if (!themeSel.options.length) {
    for (const t of THEMES) {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      themeSel.appendChild(opt);
    }
  }
  themeSel.value = state.themeId || "auto";
  document.getElementById("title-input").value = state.title || "";
}

function buildSizeButtons(current, max, kind) {
  // Returns inline HTML for 1..max buttons; kind is "col" or "row".
  const buttons = [];
  for (let i = 1; i <= max; i++) {
    buttons.push(`<button class="size-btn ${current === i ? "active" : ""}" data-${kind}="${i}" type="button">${i}</button>`);
  }
  return buttons.join("");
}

function buildFontButtons(current) {
  const sizes = [["small", "S"], ["normal", "M"], ["large", "L"], ["xlarge", "XL"]];
  return sizes.map(([k, label]) =>
    `<button class="size-btn ${current === k ? "active" : ""}" data-font="${k}" type="button">${label}</button>`
  ).join("");
}

function renderGrid() {
  const tpl = getTemplate(state.templateId);
  const grid = document.getElementById("page-grid");
  grid.style.setProperty("--grid-cols", tpl.columns);
  grid.innerHTML = "";

  state.widgets.forEach((widget, i) => {
    const def = getWidget(widget.type);
    if (!def) return;

    const slotEl = document.createElement("section");
    slotEl.className = "slot has-widget";
    slotEl.style.setProperty("--colspan", Math.min(widget.colspan, tpl.columns));
    slotEl.style.setProperty("--rowspan", widget.rowspan);
    slotEl.dataset.font = widget.fontScale || "normal";
    slotEl.dataset.widgetId = widget.id;

    const inner = document.createElement("div");
    inner.className = "slot-inner";
    slotEl.appendChild(inner);
    def.render(inner, effectiveConfig(widget));

    if (mode === "edit") {
      const bar = document.createElement("div");
      bar.className = "slot-bar";
      bar.innerHTML = `
        <span class="slot-label">${def.name}</span>
        <span class="slot-ctl"><label>w</label>${buildSizeButtons(widget.colspan, tpl.columns, "col")}</span>
        <span class="slot-ctl"><label>h</label>${buildSizeButtons(widget.rowspan, 3, "row")}</span>
        <span class="slot-ctl"><label>font</label>${buildFontButtons(widget.fontScale || "normal")}</span>
        <button class="slot-move" data-dir="-1" type="button" title="Move earlier" ${i === 0 ? "disabled" : ""}>&larr;</button>
        <button class="slot-move" data-dir="1" type="button" title="Move later" ${i === state.widgets.length - 1 ? "disabled" : ""}>&rarr;</button>
        <button class="slot-edit" type="button">edit</button>
        <button class="slot-swap" type="button">swap</button>
        <button class="slot-remove" type="button" title="Remove widget">&times; remove</button>
      `;
      slotEl.prepend(bar);

      bar.querySelector(".slot-edit").addEventListener("click", () => openWidgetEditor(widget.id));
      bar.querySelector(".slot-swap").addEventListener("click", () => openWidgetPicker(widget.id));
      bar.querySelector(".slot-remove").addEventListener("click", () => {
        state.widgets = state.widgets.filter((w) => w.id !== widget.id);
        persist();
        renderAll();
      });
      bar.querySelectorAll(".slot-move").forEach((btn) => {
        btn.addEventListener("click", () => {
          const dir = parseInt(btn.dataset.dir, 10);
          const j = i + dir;
          if (j < 0 || j >= state.widgets.length) return;
          const arr = state.widgets;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          persist();
          renderGrid();
        });
      });
      bar.querySelectorAll("[data-col]").forEach((btn) => {
        btn.addEventListener("click", () => {
          widget.colspan = parseInt(btn.dataset.col, 10);
          persist();
          renderGrid();
        });
      });
      bar.querySelectorAll("[data-row]").forEach((btn) => {
        btn.addEventListener("click", () => {
          widget.rowspan = parseInt(btn.dataset.row, 10);
          persist();
          renderGrid();
        });
      });
      bar.querySelectorAll("[data-font]").forEach((btn) => {
        btn.addEventListener("click", () => {
          widget.fontScale = btn.dataset.font;
          persist();
          renderGrid();
        });
      });
    }

    inner.addEventListener("widget-shuffle", () => {
      widget.config = { ...widget.config, salt: (widget.config.salt || 0) + 1 };
      persist();
      def.render(inner, effectiveConfig(widget));
    });

    grid.appendChild(slotEl);
  });

  if (mode === "edit") {
    const addEl = document.createElement("section");
    addEl.className = "slot add-widget-tile";
    addEl.innerHTML = `<button class="add-widget-btn" type="button">+ Add widget</button>`;
    addEl.querySelector(".add-widget-btn").addEventListener("click", openAddPicker);
    grid.appendChild(addEl);
  }
}

function renderAll() {
  state = fillDefaults(state);
  renderTheme();
  renderHeader();
  renderToolbar();
  renderGrid();
}

/* -------------------------------------------------------------------- */
/* Side-panel: widget picker + widget editor                             */
/* -------------------------------------------------------------------- */

let pickerMode = null; // "add" or "swap"
let swapTargetId = null;

function openAddPicker() {
  pickerMode = "add";
  swapTargetId = null;
  showWidgetPicker("Add a widget");
}

function openWidgetPicker(widgetId) {
  pickerMode = "swap";
  swapTargetId = widgetId;
  showWidgetPicker("Change widget type");
}

function showWidgetPicker(title) {
  const panel = document.getElementById("side-panel");
  panel.hidden = false;
  panel.innerHTML = `
    <div class="panel-header">
      <h2>${title}</h2>
      <button class="panel-close" type="button">&times;</button>
    </div>
    <ul class="widget-picker">
      ${WIDGET_ORDER.map((k) => `
        <li>
          <button type="button" data-type="${k}">
            <strong>${WIDGETS[k].name}</strong>
            <span>${WIDGETS[k].description}</span>
          </button>
        </li>
      `).join("")}
    </ul>
  `;
  panel.querySelector(".panel-close").addEventListener("click", closePanel);
  panel.querySelectorAll("[data-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      if (pickerMode === "add") {
        const w = { id: newWidgetId(), type, config: {}, colspan: 2, rowspan: 1, fontScale: "normal" };
        state.widgets.push(w);
        persist();
        renderAll();
        openWidgetEditor(w.id);
      } else {
        const w = state.widgets.find((x) => x.id === swapTargetId);
        if (w) { w.type = type; w.config = {}; }
        persist();
        renderAll();
        openWidgetEditor(swapTargetId);
      }
    });
  });
}

function openWidgetEditor(widgetId) {
  const w = state.widgets.find((x) => x.id === widgetId);
  if (!w) return;
  const def = getWidget(w.type);
  if (!def) return;
  const panel = document.getElementById("side-panel");
  panel.hidden = false;
  panel.innerHTML = `
    <div class="panel-header">
      <h2>Edit: ${def.name}</h2>
      <button class="panel-close" type="button">&times;</button>
    </div>
    <div class="panel-body"></div>
  `;
  panel.querySelector(".panel-close").addEventListener("click", closePanel);
  def.editor(panel.querySelector(".panel-body"), effectiveConfig(w), (next) => {
    w.config = next;
    persist();
    renderGrid();
  });
}

function closePanel() {
  document.getElementById("side-panel").hidden = true;
}

/* -------------------------------------------------------------------- */
/* Toolbar wire-up                                                       */
/* -------------------------------------------------------------------- */

function setupToolbar() {
  document.getElementById("edit-fab").addEventListener("click", () => {
    mode = "edit";
    const url = new URL(location.href);
    url.searchParams.set("mode", "edit");
    history.replaceState({}, "", url);
    renderAll();
  });

  document.getElementById("toggle-mode").addEventListener("click", () => {
    mode = mode === "edit" ? "view" : "edit";
    const url = new URL(location.href);
    if (mode === "edit") url.searchParams.set("mode", "edit");
    else url.searchParams.delete("mode");
    history.replaceState({}, "", url);
    closePanel();
    renderAll();
  });

  document.getElementById("template-picker").addEventListener("change", (e) => {
    const tpl = getTemplate(e.target.value);
    if (!confirm("Switch template? This replaces your current widgets with the template's starter set. (You can swap/resize/add after.)")) {
      e.target.value = state.templateId;
      return;
    }
    state.templateId = tpl.id;
    state.title = tpl.defaults.title;
    state.widgets = tpl.defaults.widgets.map((w) => ({
      id: newWidgetId(), fontScale: "normal",
      ...w, config: deepClone(w.config || {}),
    }));
    persist();
    renderAll();
  });

  document.getElementById("title-input").addEventListener("input", (e) => {
    state.title = e.target.value;
    document.getElementById("page-title").textContent = state.title;
    persist();
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (!confirm("Reset everything to the current template's defaults?")) return;
    const tpl = getTemplate(state.templateId);
    state.title = tpl.defaults.title;
    state.widgets = tpl.defaults.widgets.map((w) => ({
      id: newWidgetId(), fontScale: "normal",
      ...w, config: deepClone(w.config || {}),
    }));
    persist();
    renderAll();
  });

  document.getElementById("theme-picker").addEventListener("change", (e) => {
    state.themeId = e.target.value;
    persist();
    renderTheme();
  });

  const fsBtn = document.getElementById("fullscreen-fab");
  fsBtn.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  });
  document.addEventListener("fullscreenchange", () => {
    fsBtn.textContent = document.fullscreenElement ? "Exit full screen" : "Full screen";
  });
}

/* -------------------------------------------------------------------- */
/* Init                                                                  */
/* -------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  setupToolbar();
  renderAll();
  scheduleMidnightRefresh();
});

function scheduleMidnightRefresh() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  setTimeout(() => {
    renderGrid();
    scheduleMidnightRefresh();
  }, next - now);
}
