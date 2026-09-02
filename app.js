// Homeroom Display — app shell.
// Loads saved state from localStorage, renders a template grid with widgets,
// and (in edit mode) shows controls to swap template / change widgets / edit
// widget configs.
//
// State shape:
//   { templateId, title, widgets: { [slotId]: { type, config } } }

/* Depends on globals from templates.js (TEMPLATES, getTemplate)
 * and widgets.js (WIDGETS, WIDGET_ORDER, getWidget). */

const STORAGE_KEY = "homeroom-display-v3";

/* -------------------------------------------------------------------- */
/* State                                                                 */
/* -------------------------------------------------------------------- */

function defaultState() {
  const tpl = TEMPLATES[0];
  return {
    templateId: tpl.id,
    themeId: "auto",
    textScale: "normal",
    title: tpl.defaults.title,
    widgets: deepClone(tpl.defaults.widgets),
  };
}

const TEXT_SCALES = {
  small:  0.85,
  normal: 1,
  large:  1.2,
  xlarge: 1.5,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.templateId) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* ignore */ }
}

function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

function fillDefaults(state) {
  // Ensure every slot in the chosen template has an entry, and drop entries
  // for slots the current template doesn't expose. Widget defaults are NOT
  // merged into saved state here — see effectiveConfig() — otherwise any
  // later change to code defaults would be permanently shadowed by state
  // saved on a first load.
  const tpl = getTemplate(state.templateId);
  for (const slot of tpl.slots) {
    if (!state.widgets[slot.id]) {
      state.widgets[slot.id] = { type: null, config: {} };
    }
  }
  const validIds = new Set(tpl.slots.map((s) => s.id));
  for (const k of Object.keys(state.widgets)) {
    if (!validIds.has(k)) delete state.widgets[k];
  }
  return state;
}

// Merge live widget defaults with the user's saved overrides. Never persist
// the result — save only the user's actual edits so defaults stay live.
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
let activeSlot = null;

function persist() { saveState(state); }

function renderTheme() {
  const tpl = getTemplate(state.templateId);
  const themeOverride = getTheme(state.themeId || "auto");
  const themeClass = themeOverride.className || tpl.themeClass;
  document.body.className = `${themeClass} mode-${mode}`;
}

function renderTextScale() {
  const scale = TEXT_SCALES[state.textScale] || 1;
  document.documentElement.style.setProperty("--text-scale", scale);
}

function renderGrid() {
  const tpl = getTemplate(state.templateId);
  const grid = document.getElementById("page-grid");
  grid.style.gridTemplateAreas = tpl.grid.areas;
  grid.style.gridTemplateColumns = tpl.grid.columns;
  grid.style.gridTemplateRows = tpl.grid.rows;

  grid.innerHTML = "";
  for (const slot of tpl.slots) {
    const slotEl = document.createElement("section");
    slotEl.className = "slot";
    slotEl.style.gridArea = slot.id;
    slotEl.dataset.slot = slot.id;

    const widget = state.widgets[slot.id];
    if (widget && widget.type && getWidget(widget.type)) {
      slotEl.classList.add("has-widget");
      const inner = document.createElement("div");
      inner.className = "slot-inner";
      slotEl.appendChild(inner);

      const def = getWidget(widget.type);
      def.render(inner, effectiveConfig(widget));

      // Slot label + change button (edit mode only)
      if (mode === "edit") {
        const bar = document.createElement("div");
        bar.className = "slot-bar";
        bar.innerHTML = `
          <span class="slot-label">${slot.label}: ${def.name}</span>
          <button class="slot-edit" type="button">edit</button>
          <button class="slot-swap" type="button">change widget</button>
          <button class="slot-clear" type="button">clear</button>
        `;
        slotEl.prepend(bar);
        bar.querySelector(".slot-edit").addEventListener("click", () => openSlotEditor(slot.id));
        bar.querySelector(".slot-swap").addEventListener("click", () => openSlotPicker(slot.id));
        bar.querySelector(".slot-clear").addEventListener("click", () => {
          state.widgets[slot.id] = { type: null, config: {} };
          persist();
          renderAll();
        });
      }

      // Widgets can ask to shuffle (re-bump salt).
      inner.addEventListener("widget-shuffle", () => {
        const w = state.widgets[slot.id];
        w.config = { ...w.config, salt: (w.config.salt || 0) + 1 };
        persist();
        def.render(inner, effectiveConfig(w));
      });
    } else {
      slotEl.classList.add("empty-slot");
      slotEl.innerHTML = `
        <div class="empty-slot-inner">
          <div class="empty-slot-label">${slot.label}</div>
          ${mode === "edit"
            ? `<button class="slot-add" type="button">+ add widget</button>`
            : ""}
        </div>
      `;
      if (mode === "edit") {
        slotEl.querySelector(".slot-add").addEventListener("click", () => openSlotPicker(slot.id));
      }
    }

    grid.appendChild(slotEl);
  }
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

  const scaleSel = document.getElementById("text-scale-picker");
  if (scaleSel) scaleSel.value = state.textScale || "normal";

  document.getElementById("title-input").value = state.title || "";
}

function renderAll() {
  state = fillDefaults(state);
  renderTheme();
  renderTextScale();
  renderHeader();
  renderToolbar();
  renderGrid();
}

/* -------------------------------------------------------------------- */
/* Side-panel: widget picker + widget editor                             */
/* -------------------------------------------------------------------- */

function openSlotPicker(slotId) {
  activeSlot = slotId;
  const panel = document.getElementById("side-panel");
  panel.hidden = false;
  panel.innerHTML = `
    <div class="panel-header">
      <h2>Pick a widget</h2>
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
      state.widgets[slotId] = { type, config: {} };
      persist();
      renderAll();
      openSlotEditor(slotId);
    });
  });
}

function openSlotEditor(slotId) {
  activeSlot = slotId;
  const w = state.widgets[slotId];
  if (!w || !w.type) return openSlotPicker(slotId);
  const def = getWidget(w.type);
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
    state.widgets[slotId] = { type: w.type, config: next };
    persist();
    renderGrid();
  });
}

function closePanel() {
  document.getElementById("side-panel").hidden = true;
  activeSlot = null;
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
    state.templateId = tpl.id;
    // Reset widgets to template defaults if user confirms.
    if (confirm("Switch template? This will reset which widgets are placed in which slots (your widget content is preserved when slot names match).")) {
      const preserved = { ...state.widgets };
      state.widgets = deepClone(tpl.defaults.widgets);
      for (const slot of tpl.slots) {
        if (preserved[slot.id]) state.widgets[slot.id] = preserved[slot.id];
      }
      persist();
      renderAll();
    } else {
      e.target.value = state.templateId;
    }
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
    state.widgets = deepClone(tpl.defaults.widgets);
    persist();
    renderAll();
  });

  document.getElementById("theme-picker").addEventListener("change", (e) => {
    state.themeId = e.target.value;
    persist();
    renderTheme();
  });

  document.getElementById("text-scale-picker").addEventListener("change", (e) => {
    state.textScale = e.target.value;
    persist();
    renderTextScale();
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
  // Refresh date widget at midnight so the date rolls over.
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
