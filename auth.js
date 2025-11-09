/* auth.js - lightweight client-side auth (for demo/prototyping only) */

/*
Storage keys:
  - users_db_v1 : object keyed by username { username, email, pass }
  - auth_current_v1 : username of logged in user (or null)
*/

const AUTH_USERS_KEY = 'users_db_v1';
const AUTH_CURR_KEY = 'auth_current_v1';

// tiny encoding — NOT a real hash. Replace with server-side hashing for production.
function simpleHash(s) {
  try {
    // use btoa as simple obfuscation, and rotate characters
    return btoa(s).split('').reverse().join('');
  } catch (e) {
    // fallback
    return s.split('').reverse().join('');
  }
}

function loadUsers() {
  const raw = localStorage.getItem(AUTH_USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function registerUser({ username, email, password }) {
  username = username.trim().toLowerCase();
  email = email.trim();
  if (!username || !email || !password) {
    return { ok: false, error: 'Missing fields' };
  }
  const users = loadUsers();
  if (users[username]) return { ok: false, error: 'Username taken' };
  // ensure unique email
  for (const k in users) if (users[k].email === email) return { ok: false, error: 'Email already used' };

  users[username] = {
    username,
    email,
    pass: simpleHash(password)
  };
  saveUsers(users);
  // auto-login after register
  localStorage.setItem(AUTH_CURR_KEY, username);
  return { ok: true };
}

function loginUser({ username, password }) {
  username = username.trim().toLowerCase();
  const users = loadUsers();
  const u = users[username];
  if (!u) return { ok: false, error: 'Invalid username or password' };
  if (u.pass !== simpleHash(password)) return { ok: false, error: 'Invalid username or password' };
  localStorage.setItem(AUTH_CURR_KEY, username);
  return { ok: true };
}

function logoutUser() {
  localStorage.removeItem(AUTH_CURR_KEY);
}

function getCurrentUser() {
  const uname = localStorage.getItem(AUTH_CURR_KEY);
  if (!uname) return null;
  const users = loadUsers();
  return users[uname] ? { username: users[uname].username, email: users[uname].email } : null;
}

// UI helpers: call on page load to update nav & protected controls
function authApplyUIState() {
  const user = getCurrentUser();
  const guestEl = document.getElementById('auth-guest');
  const userEl = document.getElementById('auth-user');
  const userDisplay = document.getElementById('userDisplay');
  const btnAdd = document.getElementById('btnAdd');

  if (user) {
    if (guestEl) {
      // remove guest controls from the DOM so Login/Register buttons aren't visible
      // after a successful login on the current page
      try { guestEl.remove(); } catch (e) { guestEl.style.display = 'none'; }
    }
    if (userEl) userEl.style.display = '';
    if (userDisplay) userDisplay.textContent = user.username;
    if (btnAdd) btnAdd.style.display = ''; // allow adding events only for logged-in users
  } else {
    if (guestEl) guestEl.style.display = '';
    if (userEl) userEl.style.display = 'none';
    if (btnAdd) btnAdd.style.display = 'none'; // hide add button for guests
  }
}

// on logout button click (if exists)
// Check if user is already logged in on login/register pages
function checkAuthRedirect() {
  const user = getCurrentUser();
  const isAuthPage = window.location.pathname.endsWith('login.html') || 
                    window.location.pathname.endsWith('register.html');
  
  if (user && isAuthPage) {
    window.location.href = 'index.html';
    return true;
  }
  return false;
}

// Run auth check on page load
document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuthRedirect()) {
    authApplyUIState();
  }
});

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'logoutBtn') {
    logoutUser();
    authApplyUIState();
    window.location.href = 'login.html';
    window.location.href = 'index.html';
  }
});

// convenience: require login, otherwise redirect to login page
function requireAuthRedirect(redirectTo = 'login.html') {
  if (!getCurrentUser()) {
    // preserve original page to come back to
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${redirectTo}?next=${next}`;
    return false;
  }
  return true;
}

// expose functions to window for pages
window.auth = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  authApplyUIState,
  requireAuthRedirect
};

// initialize UI state on load
document.addEventListener('DOMContentLoaded', () => {
  authApplyUIState();
});
