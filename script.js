(() => {
  "use strict";

  const STORAGE_KEY = "parish-calendar-activities";
  const TYPE_ORDER = ["Devotional", "Physical", "Fellowship", "Outreach", "Educational", "Service", "Other"];
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  /** @type {{id:string, date:string, name:string, theme:string, description:string, type:string}[]} */
  let activities = load();
  let activeFilters = new Set(); // empty = show all
  let currentView = "list";
  let editingId = null;

  // ---------- persistence ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Could not read saved activities", e);
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch (e) {
      console.warn("Could not save activities", e);
    }
  }

  // ---------- elements ----------
  const form = document.getElementById("activityForm");
  const dateInput = document.getElementById("date");
  const typeSelect = document.getElementById("type");
  const otherTypeField = document.getElementById("otherTypeField");
  const otherTypeInput = document.getElementById("otherType");
  const nameInput = document.getElementById("name");
  const themeInput = document.getElementById("theme");
  const descInput = document.getElementById("description");
  const idInput = document.getElementById("activityId");
  const submitBtn = document.getElementById("submitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const formTitle = document.getElementById("formTitle");
  const formTab = document.getElementById("formTab");

  const listView = document.getElementById("listView");
  const calendarView = document.getElementById("calendarView");
  const emptyState = document.getElementById("emptyState");
  const filterChips = document.getElementById("filterChips");
  const btnList = document.getElementById("btnList");
  const btnCalendar = document.getElementById("btnCalendar");
  const printBtn = document.getElementById("printBtn");
  const printDateRange = document.getElementById("printDateRange");

  // ---------- form behavior ----------
  typeSelect.addEventListener("change", () => {
    otherTypeField.hidden = typeSelect.value !== "Other";
    if (typeSelect.value === "Other") otherTypeInput.focus();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!dateInput.value || !typeSelect.value || !nameInput.value.trim()) {
      form.reportValidity();
      return;
    }
    const resolvedType = typeSelect.value === "Other"
      ? (otherTypeInput.value.trim() || "Other")
      : typeSelect.value;

    const record = {
      id: editingId || String(Date.now()) + Math.random().toString(16).slice(2),
      date: dateInput.value,
      name: nameInput.value.trim(),
      theme: themeInput.value.trim(),
      description: descInput.value.trim(),
      type: resolvedType,
    };

    if (editingId) {
      const idx = activities.findIndex(a => a.id === editingId);
      if (idx !== -1) activities[idx] = record;
    } else {
      activities.push(record);
    }

    save();
    resetForm();
    renderAll();
  });

  cancelEditBtn.addEventListener("click", resetForm);

  function resetForm() {
    form.reset();
    otherTypeField.hidden = true;
    idInput.value = "";
    editingId = null;
    submitBtn.textContent = "Add to Calendar";
    cancelEditBtn.hidden = true;
    formTitle.textContent = "Add an Activity";
    formTab.textContent = "New Entry";
  }

  function startEdit(id) {
    const a = activities.find(x => x.id === id);
    if (!a) return;
    editingId = id;
    idInput.value = id;
    dateInput.value = a.date;
    nameInput.value = a.name;
    themeInput.value = a.theme;
    descInput.value = a.description;

    if (TYPE_ORDER.includes(a.type) && a.type !== "Other") {
      typeSelect.value = a.type;
      otherTypeField.hidden = true;
    } else {
      typeSelect.value = "Other";
      otherTypeField.hidden = false;
      otherTypeInput.value = a.type;
    }

    submitBtn.textContent = "Save Changes";
    cancelEditBtn.hidden = false;
    formTitle.textContent = "Edit Activity";
    formTab.textContent = "Editing";
    document.getElementById("formCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteActivity(id) {
    const a = activities.find(x => x.id === id);
    const label = a ? `"${a.name}"` : "this activity";
    if (!confirm(`Remove ${label} from the calendar?`)) return;
    activities = activities.filter(x => x.id !== id);
    save();
    if (editingId === id) resetForm();
    renderAll();
  }

  // ---------- view toggle ----------
  btnList.addEventListener("click", () => setView("list"));
  btnCalendar.addEventListener("click", () => setView("calendar"));

  function setView(view) {
    currentView = view;
    btnList.classList.toggle("active", view === "list");
    btnCalendar.classList.toggle("active", view === "calendar");
    listView.hidden = view !== "list";
    calendarView.hidden = view !== "calendar";
  }

  // ---------- filters ----------
  function renderFilterChips() {
    const typesInUse = Array.from(new Set(activities.map(a => a.type)));
    const orderedTypes = TYPE_ORDER.filter(t => typesInUse.includes(t))
      .concat(typesInUse.filter(t => !TYPE_ORDER.includes(t)));

    filterChips.innerHTML = "";
    orderedTypes.forEach(type => {
      const chip = document.createElement("button");
      chip.className = "chip" + (activeFilters.has(type) ? " active" : "");
      chip.textContent = type;
      chip.dataset.type = type;
      chip.type = "button";
      chip.addEventListener("click", () => {
        activeFilters.has(type) ? activeFilters.delete(type) : activeFilters.add(type);
        renderAll();
      });
      filterChips.appendChild(chip);
    });
  }

  function visibleActivities() {
    const filtered = activeFilters.size
      ? activities.filter(a => activeFilters.has(a.type))
      : activities.slice();
    return filtered.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ---------- helpers ----------
  function parseLocalDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------- render: list ----------
  function renderList() {
    const items = visibleActivities();
    listView.innerHTML = "";

    if (!items.length) return;

    let currentMonthKey = null;
    let monthContainer = null;

    items.forEach(a => {
      const d = parseLocalDate(a.date);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;

      if (monthKey !== currentMonthKey) {
        currentMonthKey = monthKey;
        const group = document.createElement("div");
        group.className = "month-group";
        const label = document.createElement("h3");
        label.className = "month-label";
        label.textContent = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        group.appendChild(label);
        listView.appendChild(group);
        monthContainer = group;
      }

      const card = document.createElement("article");
      card.className = "activity-card";
      card.dataset.type = a.type;
      card.innerHTML = `
        <div class="card-date">
          <div class="dow">${DOW_NAMES[d.getDay()]}</div>
          <div class="dom">${String(d.getDate()).padStart(2, "0")}</div>
          <div class="mon">${MONTH_NAMES[d.getMonth()].slice(0,3)}</div>
        </div>
        <div class="card-body">
          <h3>${escapeHtml(a.name)}</h3>
          ${a.theme ? `<p class="card-theme">&ldquo;${escapeHtml(a.theme)}&rdquo;</p>` : ""}
          ${a.description ? `<p class="card-desc">${escapeHtml(a.description)}</p>` : ""}
          <span class="type-badge">${escapeHtml(a.type)}</span>
        </div>
        <div class="card-actions no-print">
          <button class="icon-btn" title="Edit" data-action="edit" data-id="${a.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn" title="Delete" data-action="delete" data-id="${a.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;
      monthContainer.appendChild(card);
    });

    listView.querySelectorAll('[data-action="edit"]').forEach(btn =>
      btn.addEventListener("click", () => startEdit(btn.dataset.id)));
    listView.querySelectorAll('[data-action="delete"]').forEach(btn =>
      btn.addEventListener("click", () => deleteActivity(btn.dataset.id)));
  }

  // ---------- render: calendar ----------
  function renderCalendar() {
    const items = visibleActivities();
    calendarView.innerHTML = "";
    if (!items.length) return;

    const byMonth = new Map();
    items.forEach(a => {
      const d = parseLocalDate(a.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!byMonth.has(key)) byMonth.set(key, { year: d.getFullYear(), month: d.getMonth(), items: [] });
      byMonth.get(key).items.push(a);
    });

    Array.from(byMonth.values())
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .forEach(({ year, month, items: monthItems }) => {
        const section = document.createElement("div");
        section.className = "cal-month";

        const title = document.createElement("h3");
        title.className = "cal-month-title";
        title.textContent = `${MONTH_NAMES[month]} ${year}`;
        section.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "cal-grid";
        DOW_NAMES.forEach(dow => {
          const cell = document.createElement("div");
          cell.className = "cal-dow";
          cell.textContent = dow;
          grid.appendChild(cell);
        });

        const firstDow = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDow; i++) {
          const empty = document.createElement("div");
          empty.className = "cal-cell empty";
          grid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
          const cell = document.createElement("div");
          cell.className = "cal-cell";
          const num = document.createElement("div");
          num.className = "cell-num";
          num.textContent = day;
          cell.appendChild(num);

          monthItems
            .filter(a => parseLocalDate(a.date).getDate() === day)
            .forEach(a => {
              const pill = document.createElement("div");
              pill.className = "cal-pill";
              pill.dataset.type = a.type;
              pill.title = `${a.name} (${a.type})`;
              pill.textContent = a.name;
              cell.appendChild(pill);
            });

          grid.appendChild(cell);
        }

        section.appendChild(grid);
        calendarView.appendChild(section);
      });
  }

  // ---------- print header range ----------
  function updatePrintRange() {
    const items = visibleActivities();
    if (!items.length) {
      printDateRange.textContent = "";
      return;
    }
    const first = parseLocalDate(items[0].date);
    const last = parseLocalDate(items[items.length - 1].date);
    const fmt = d => `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    printDateRange.textContent = items.length === 1
      ? fmt(first)
      : `${fmt(first)} — ${fmt(last)}`;
  }

  printBtn.addEventListener("click", () => window.print());

  // ---------- master render ----------
  function renderAll() {
    renderFilterChips();
    renderList();
    renderCalendar();
    updatePrintRange();
    emptyState.style.display = activities.length ? "none" : "block";
  }

  setView("list");
  renderAll();
})();
