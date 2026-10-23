// Homeroom Display — Gridstack-backed layout.
//
// State shape (v5):
//   { templateId, themeId, title, widgets: [ ... ] }
// Each widget: { id, type, config, x, y, w, h, fontScale }
//
// In edit mode, Gridstack handles drag-to-move (grab the slot header) and
// drag-to-resize (grab any edge). float:false packs items upward, so
// deleting one causes the rest to auto-fill the gap.

/* Depends on globals from templates.js (TEMPLATES, getTemplate, THEMES,
 * getTheme) and widgets.js (WIDGETS, WIDGET_ORDER, getWidget), plus
 * GridStack from the gridstack-all.js script tag. */

const STORAGE_KEY = "homeroom-display-v5";

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
  state.widgets = (state.widgets || []).map((w) => ({
    id: w.id || newWidgetId(),
    type: w.type,
    config: w.config || {},
    w: w.w || 2,
    h: w.h || 2,
    x: typeof w.x === "number" ? w.x : undefined,
    y: typeof w.y === "number" ? w.y : undefined,
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
/* App state (module-level)                                              */
/* -------------------------------------------------------------------- */

let state = fillDefaults(loadState());
let mode = new URLSearchParams(location.search).get("mode") === "edit" ? "edit" : "view";
let grid = null;

function persist() { saveState(state); }

/* -------------------------------------------------------------------- */
/* Rendering                                                             */
/* -------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------- */
/* Grid item DOM                                                         */
/* -------------------------------------------------------------------- */

function buildFontButtons(current) {
  const sizes = [["small", "S"], ["normal", "M"], ["large", "L"], ["xlarge", "XL"]];
  return sizes.map(([k, label]) =>
    `<button class="font-btn ${current === k ? "active" : ""}" data-font="${k}" type="button">${label}</button>`
  ).join("");
}

function renderWidgetContent(contentEl, widget) {
  const def = getWidget(widget.type);
  if (!def) return;
  contentEl.innerHTML = "";
  contentEl.classList.remove("gs-content-ready");

  const bar = document.createElement("div");
  bar.className = "slot-bar widget-drag-handle";
  bar.innerHTML = `
    <span class="slot-label">&#x2630; ${def.name}</span>
    <span class="slot-ctl"><label>font</label>${buildFontButtons(widget.fontScale || "normal")}</span>
    <button class="slot-edit" type="button">edit</button>
    <button class="slot-swap" type="button">swap</button>
    <button class="slot-remove" type="button" title="Remove">&times;</button>
  `;
  contentEl.appendChild(bar);

  const inner = document.createElement("div");
  inner.className = "slot-inner";
  contentEl.appendChild(inner);
  def.render(inner, effectiveConfig(widget));

  bar.querySelector(".slot-edit").addEventListener("click", (e) => {
    e.stopPropagation();
    openWidgetEditor(widget.id);
  });
  bar.querySelector(".slot-swap").addEventListener("click", (e) => {
    e.stopPropagation();
    openWidgetPicker(widget.id);
  });
  bar.querySelector(".slot-remove").addEventListener("click", (e) => {
    e.stopPropagation();
    removeWidget(widget.id);
  });
  bar.querySelectorAll(".font-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      widget.fontScale = btn.dataset.font;
      const item = contentEl.closest(".grid-stack-item");
      if (item) item.dataset.font = widget.fontScale;
      bar.querySelectorAll(".font-btn").forEach((b) => b.classList.toggle("active", b === btn));
      persist();
    });
  });

  inner.addEventListener("widget-shuffle", () => {
    widget.config = { ...widget.config, salt: (widget.config.salt || 0) + 1 };
    persist();
    def.render(inner, effectiveConfig(widget));
  });
}

function buildItemElement(widget, tpl) {
  const el = document.createElement("div");
  el.className = "grid-stack-item";
  el.setAttribute("gs-id", widget.id);
  el.setAttribute("gs-w", Math.min(widget.w || 2, tpl.columns));
  el.setAttribute("gs-h", widget.h || 2);
  if (typeof widget.x === "number") el.setAttribute("gs-x", widget.x);
  if (typeof widget.y === "number") el.setAttribute("gs-y", widget.y);
  el.dataset.font = widget.fontScale || "normal";

  const content = document.createElement("div");
  content.className = "grid-stack-item-content";
  el.appendChild(content);
  renderWidgetContent(content, widget);
  return el;
}

/* -------------------------------------------------------------------- */
/* Grid lifecycle                                                        */
/* -------------------------------------------------------------------- */

function buildGrid() {
  const container = document.getElementById("page-grid");
  if (typeof GridStack === "undefined") {
    container.innerHTML = `<div class="load-error">
      <strong>Grid library didn't load.</strong><br/>
      The <code>vendor/gridstack</code> files may be missing or blocked. Try a hard refresh (Ctrl/Cmd+Shift+R). If this is deployed on Netlify, confirm the <code>vendor/</code> folder is in the publish directory.
    </div>`;
    return;
  }

  if (grid) {
    grid.destroy(false);
    grid = null;
  }
  container.className = "grid-stack";
  container.innerHTML = "";

  const tpl = getTemplate(state.templateId);
  state.widgets.forEach((w) => {
    container.appendChild(buildItemElement(w, tpl));
  });

  grid = GridStack.init({
    column: tpl.columns,
    cellHeight: 70,
    margin: 10,
    float: false,
    animate: true,
    disableDrag: mode !== "edit",
    disableResize: mode !== "edit",
    draggable: { handle: ".widget-drag-handle" },
    resizable: { handles: "e, se, s, sw, w" },
    minRow: 4,
  }, container);

  grid.on("change", onGridChange);
}

function onGridChange(_event, items) {
  if (!items) return;
  for (const item of items) {
    const w = state.widgets.find((x) => x.id === item.id);
    if (w) {
      w.x = item.x;
      w.y = item.y;
      w.w = item.w;
      w.h = item.h;
    }
  }
  persist();
}

function removeWidget(id) {
  if (!grid) return;
  const el = document.querySelector(`.grid-stack-item[gs-id="${id}"]`);
  if (el) grid.removeWidget(el);
  state.widgets = state.widgets.filter((w) => w.id !== id);
  persist();
}

function addWidget(type) {
  const tpl = getTemplate(state.templateId);
  const w = {
    id: newWidgetId(), type, config: {},
    w: Math.min(2, tpl.columns), h: 2, fontScale: "normal",
  };
  state.widgets.push(w);
  const el = buildItemElement(w, tpl);
  document.getElementById("page-grid").appendChild(el);
  grid.makeWidget(el);
  persist();
  openWidgetEditor(w.id);
}

/* -------------------------------------------------------------------- */
/* Side panel                                                            */
/* -------------------------------------------------------------------- */

let pickerMode = null;
let swapTargetId = null;

function openWidgetPicker(widgetId) {
  pickerMode = "swap";
  swapTargetId = widgetId;
  showWidgetPicker("Change widget type");
}

function openAddPicker() {
  pickerMode = "add";
  swapTargetId = null;
  showWidgetPicker("Add a widget");
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
        addWidget(type);
      } else {
        const w = state.widgets.find((x) => x.id === swapTargetId);
        if (w) {
          w.type = type;
          w.config = {};
          const content = document.querySelector(`.grid-stack-item[gs-id="${swapTargetId}"] .grid-stack-item-content`);
          if (content) renderWidgetContent(content, w);
          persist();
          openWidgetEditor(swapTargetId);
        }
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
    const content = document.querySelector(`.grid-stack-item[gs-id="${widgetId}"] .grid-stack-item-content`);
    if (content) {
      const inner = content.querySelector(".slot-inner");
      if (inner) def.render(inner, effectiveConfig(w));
    }
  });
}

function closePanel() {
  document.getElementById("side-panel").hidden = true;
}

/* -------------------------------------------------------------------- */
/* Toolbar                                                               */
/* -------------------------------------------------------------------- */

function setupToolbar() {
  document.getElementById("edit-fab").addEventListener("click", () => {
    setMode("edit");
  });

  document.getElementById("toggle-mode").addEventListener("click", () => {
    setMode(mode === "edit" ? "view" : "edit");
  });

  document.getElementById("add-widget-btn").addEventListener("click", openAddPicker);

  document.getElementById("template-picker").addEventListener("change", (e) => {
    if (!confirm("Switch template? This replaces your current widgets with the template's starter set.")) {
      e.target.value = state.templateId;
      return;
    }
    const tpl = getTemplate(e.target.value);
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

function setMode(next) {
  mode = next;
  const url = new URL(location.href);
  if (mode === "edit") url.searchParams.set("mode", "edit");
  else url.searchParams.delete("mode");
  history.replaceState({}, "", url);
  closePanel();
  renderAll();
}

function renderAll() {
  state = fillDefaults(state);
  renderTheme();
  renderHeader();
  renderToolbar();
  buildGrid();
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
    buildGrid();
    scheduleMidnightRefresh();
  }, next - now);
}
