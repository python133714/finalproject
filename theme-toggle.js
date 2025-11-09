/* theme-toggle.js (robust) */
(() => {
  const KEY = 'eventify_theme'; // values: 'dark' | 'light' | null/absent
  let toggleBtn = null;
  let iconEl = null;

  function savedPreference() {
    const v = localStorage.getItem(KEY);
    return v === 'dark' ? 'dark' : v === 'light' ? 'light' : null;
  }

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      if (iconEl) iconEl.textContent = '☀️';
    } else {
      document.documentElement.classList.remove('dark');
      if (iconEl) iconEl.textContent = '🌙';
    }
  }

  function init() {
    // find elements after DOM is ready
    toggleBtn = document.getElementById('themeToggle');
    iconEl = document.getElementById('themeIcon');

    // determine initial theme: saved > system > light
    const saved = savedPreference();
    const initial = saved ? saved : (systemPrefersDark() ? 'dark' : 'light');
    applyTheme(initial);

    // If user has not saved preference, watch system changes so UI adapts
    if (!saved && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // only auto-change when user hasn't explicitly chosen
        if (!savedPreference()) applyTheme(e.matches ? 'dark' : 'light');
      });
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        // flip current applied theme
        const nowIsDark = document.documentElement.classList.contains('dark');
        const next = nowIsDark ? 'light' : 'dark';
        localStorage.setItem(KEY, next); // persist user's choice
        applyTheme(next);
      });
    } else {
      // no button found; no-op (prevents errors)
      // console.info('themeToggle button not found on page');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
