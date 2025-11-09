/* Event Manager - scripts.js
   - Uses localStorage to persist events.
   - Provides client-side validation, create/read/update/delete, search, filter, sort.
*/

// helper: generate unique id
const uid = () => 'ev_' + Date.now() + '_' + Math.floor(Math.random()*1000);

// keys
const STORAGE_KEY = 'events_data_v1';

// DOM elements
const eventsTbody = document.getElementById('eventsTbody');
const eventForm = document.getElementById('eventForm');
const modalTitle = document.getElementById('modalTitle');
const eventModalEl = document.getElementById('eventModal');
const eventModal = new bootstrap.Modal(eventModalEl);
const btnAdd = document.getElementById('btnAdd');
const deleteBtn = document.getElementById('deleteBtn');
const searchInput = document.getElementById('searchInput');
const filterDate = document.getElementById('filterDate');
const sortBy = document.getElementById('sortBy');
const noEvents = document.getElementById('noEvents');
const storageInfo = document.getElementById('storageInfo');

// form fields
const fields = {
  id: document.getElementById('eventId'),
  name: document.getElementById('eventName'),
  email: document.getElementById('organizerEmail'),
  date: document.getElementById('eventDate'),
  time: document.getElementById('eventTime'),
  capacity: document.getElementById('capacity'),
  venue: document.getElementById('venue'),
  desc: document.getElementById('description'),
};

// app state
let events = [];

// load from storage or seed sample
function loadEvents() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      events = JSON.parse(raw);
    } catch (e) { events = []; }
  } else {
    // seed sample events for first run
    events = [
      {
        id: uid(),
        name: "Annual Tech Conference 2025",
        email: "organizer@techconf.example",
        date: offsetDate(5),
        time: "09:00",
        capacity: 500,
        venue: "Grand Convention Center",
        desc: "Join us for the biggest tech conference of the year featuring AI, Web3, and Cloud Computing talks"
      },
      {
        id: uid(),
        name: "Music Festival",
        email: "events@musicfest.example",
        date: offsetDate(15),
        time: "14:00",
        capacity: 2000,
        venue: "Central Park Amphitheater",
        desc: "A day of live music featuring local and international artists across multiple genres"
      },
      {
        id: uid(),
        name: "Startup Networking Mixer",
        email: "community@startup.example",
        date: offsetDate(3),
        time: "18:30",
        capacity: 150,
        venue: "Innovation Hub",
        desc: "Connect with fellow entrepreneurs, investors, and tech enthusiasts over drinks and discussions"
      },
      {
        id: uid(),
        name: "Art Exhibition: Digital Dreams",
        email: "gallery@arts.example",
        date: offsetDate(7),
        time: "11:00",
        capacity: 200,
        venue: "Modern Art Gallery",
        desc: "An immersive exhibition featuring digital art, NFTs, and interactive installations"
      },
      {
        id: uid(),
        name: "Wellness Workshop",
        email: "info@wellness.example",
        date: offsetDate(10),
        time: "08:30",
        capacity: 50,
        venue: "Zen Garden Studio",
        desc: "A morning of yoga, meditation, and mindfulness practices for busy professionals"
      },
      {
        id: uid(),
        name: "Food & Wine Festival",
        email: "taste@foodfest.example",
        date: offsetDate(20),
        time: "12:00",
        capacity: 1000,
        venue: "Riverfront Plaza",
        desc: "Sample cuisine from top local restaurants and wineries while enjoying live entertainment"
      }
    ];
    saveEvents();
  }
}

// utility: date in YYYY-MM-DD (offset days)
function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0,10);
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  updateStorageInfo();
}

// render table
function renderEvents() {
  const q = searchInput.value.trim().toLowerCase();
  const dateFilter = filterDate.value;
  const sort = sortBy.value;

  // filter
  let list = events.filter(ev => {
    if (q) {
      const hay = (ev.name + ' ' + ev.venue + ' ' + ev.desc + ' ' + ev.email).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (dateFilter === 'upcoming') return new Date(ev.date) >= startOfDay(new Date());
    if (dateFilter === 'past') return new Date(ev.date) < startOfDay(new Date());
    return true;
  });

  // sort
  if (sort === 'dateAsc') list.sort((a,b) => new Date(a.date+'T'+a.time) - new Date(b.date+'T'+b.time));
  if (sort === 'dateDesc') list.sort((a,b) => new Date(b.date+'T'+b.time) - new Date(a.date+'T'+a.time));
  if (sort === 'nameAsc') list.sort((a,b) => a.name.localeCompare(b.name));

  eventsTbody.innerHTML = '';
  if (list.length === 0) {
    noEvents.style.display = '';
    return;
  }
  noEvents.style.display = 'none';

  for (const ev of list) {
    const tr = document.createElement('tr');

    const dateTime = `${formatDate(ev.date)} ${ev.time}`;
    tr.innerHTML = `
      <td><strong>${escapeHtml(ev.name)}</strong><div class="small text-muted">${escapeHtml(ev.desc || '')}</div></td>
      <td>${dateTime}</td>
      <td>${escapeHtml(ev.venue)}</td>
      <td>${ev.capacity}</td>
      <td>${escapeHtml(ev.email)}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${ev.id}">Edit</button>
        <button class="btn btn-sm btn-outline-secondary me-1" data-action="duplicate" data-id="${ev.id}">Duplicate</button>
        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${ev.id}">Delete</button>
      </td>
    `;
    eventsTbody.appendChild(tr);
  }
}

// helpers
function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function formatDate(iso) {
  // local-friendly format
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString();
}
function escapeHtml(s) {
  if (!s) return '';
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

// handle clicks on table (delegation)
eventsTbody.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (action === 'edit') openEditModal(id);
  if (action === 'duplicate') duplicateEvent(id);
  if (action === 'delete') removeEvent(id);
});

// Add button: prepare modal for new event
btnAdd.addEventListener('click', () => {
  openAddModal();
});

// open add modal
function openAddModal() {
  modalTitle.textContent = 'Add Event';
  deleteBtn.style.display = 'none';
  eventForm.reset();
  fields.id.value = '';
  // default date to today
  fields.date.value = new Date().toISOString().slice(0,10);
  eventModal.show();
}

// open edit
function openEditModal(id) {
  const ev = events.find(x => x.id === id);
  if (!ev) return;
  modalTitle.textContent = 'Edit Event';
  deleteBtn.style.display = '';
  fields.id.value = ev.id;
  fields.name.value = ev.name;
  fields.email.value = ev.email;
  fields.date.value = ev.date;
  fields.time.value = ev.time;
  fields.capacity.value = ev.capacity;
  fields.venue.value = ev.venue;
  fields.desc.value = ev.desc || '';
  eventModal.show();
}

// duplicate event
function duplicateEvent(id) {
  const ev = events.find(x => x.id === id);
  if (!ev) return;
  const copy = {...ev, id: uid(), name: ev.name + ' (Copy)', date: ev.date};
  events.push(copy);
  saveEvents();
  renderEvents();
}

// delete from list (button in row)
function removeEvent(id) {
  if (!confirm('Delete this event? This cannot be undone.')) return;
  events = events.filter(x => x.id !== id);
  saveEvents();
  renderEvents();
}

// Delete button in modal (delete currently edited)
deleteBtn.addEventListener('click', () => {
  const id = fields.id.value;
  if (!id) return;
  if (!confirm('Delete this event?')) return;
  events = events.filter(x => x.id !== id);
  saveEvents();
  eventModal.hide();
  renderEvents();
});

// form validation + save
eventForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // perform custom validation
  clearFormValidation();

  const data = {
    id: fields.id.value || uid(),
    name: fields.name.value.trim(),
    email: fields.email.value.trim(),
    date: fields.date.value,
    time: fields.time.value,
    capacity: Number(fields.capacity.value),
    venue: fields.venue.value.trim(),
    desc: fields.desc.value.trim(),
  };

  const errors = validateEvent(data);
  if (Object.keys(errors).length > 0) {
    // show errors
    for (const k of Object.keys(errors)) {
      const el = fields[k];
      if (el) el.classList.add('is-invalid');
    }
    return;
  }

  // save or update
  const existingIndex = events.findIndex(x => x.id === data.id);
  if (existingIndex >= 0) {
    events[existingIndex] = data;
  } else {
    events.push(data);
  }
  saveEvents();
  eventModal.hide();
  renderEvents();
});

// validate event - returns object with field keys that are invalid
function validateEvent(ev) {
  const bad = {};
  if (!ev.name || ev.name.length < 2) bad.name = 'Name too short';
  if (!ev.email || !/^\S+@\S+\.\S+$/.test(ev.email)) bad.email = 'Email invalid';
  if (!ev.date) bad.date = 'Date required';
  else {
    const selected = new Date(ev.date + 'T00:00:00');
    const today = startOfDay(new Date());
    // allow same day or future; if you want future only, change to >
    if (selected < today) bad.date = 'Date must be today or later';
  }
  if (!ev.time) bad.time = 'Time required';
  if (!Number.isInteger(ev.capacity) || ev.capacity < 1) bad.capacity = 'Capacity must be positive integer';
  if (!ev.venue) bad.venue = 'Venue required';
  return bad;
}

function clearFormValidation() {
  for (const key in fields) {
    if (fields[key]) fields[key].classList.remove('is-invalid');
  }
}

// search / filters
searchInput.addEventListener('input', debounce(renderEvents, 200));
filterDate.addEventListener('change', renderEvents);
sortBy.addEventListener('change', renderEvents);

// small utilities
function debounce(fn, t=100) {
  let to;
  return (...args) => {
    clearTimeout(to);
    to = setTimeout(() => fn(...args), t);
  };
}

// show storage usage info
function updateStorageInfo() {
  try {
    const used = new Blob([localStorage.getItem(STORAGE_KEY) || '']).size;
    storageInfo.textContent = `Local storage used: ${(used/1024).toFixed(1)} KB`;
  } catch (e) {
    storageInfo.textContent = '';
  }
}

// initial boot
loadEvents();
updateStorageInfo();
renderEvents();
