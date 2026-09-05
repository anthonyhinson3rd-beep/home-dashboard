// Small runtime overrides so the dashboard can evolve without rewriting app.js.
(function () {
  const STORAGE_KEY = 'homeDashboardCalendarKey';

  // Keep the display awake while the dashboard is actually visible. Vega's
  // WebView is Chromium-based, so use the standard Screen Wake Lock API when
  // available. The browser automatically releases the lock when hidden; we
  // request it again whenever the dashboard becomes visible/active.
  let screenWakeLock = null;

  async function requestScreenWakeLock() {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;

    try {
      if (screenWakeLock && !screenWakeLock.released) return;
      screenWakeLock = await navigator.wakeLock.request('screen');
      console.info('[HomeDashboard] Screen wake lock acquired');
      screenWakeLock.addEventListener('release', () => {
        console.info('[HomeDashboard] Screen wake lock released');
        screenWakeLock = null;
      });
    } catch (error) {
      console.warn('[HomeDashboard] Screen wake lock unavailable:', error);
      screenWakeLock = null;
    }
  }

  requestScreenWakeLock();
  window.addEventListener('load', requestScreenWakeLock);
  window.addEventListener('focus', requestScreenWakeLock);
  window.addEventListener('pageshow', requestScreenWakeLock);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(requestScreenWakeLock, 250);
    }
  });

  // Periodically re-check in case the OS/browser released the lock without a
  // visibility transition.
  setInterval(requestScreenWakeLock, 30 * 1000);

  const originalSetter = window.setHomeDashboardCalendarKey;
  window.setHomeDashboardCalendarKey = function (key) {
    const value = String(key || '');
    if (value) {
      try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
    }
    if (typeof originalSetter === 'function') originalSetter(value);
  };

  // Fire TV one-time bootstrap: accept ?key= once, store it locally, then
  // remove the key from the visible URL so normal refreshes use localStorage.
  try {
    const params = new URLSearchParams(location.search);
    const bootstrapKey = params.get('key') || '';
    if (bootstrapKey) {
      localStorage.setItem(STORAGE_KEY, bootstrapKey);
      window.HOME_DASHBOARD_CALENDAR_KEY = bootstrapKey;
      params.delete('key');
      const clean = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}${location.hash}`;
      history.replaceState(null, '', clean);
    }
  } catch (_) {}

  try {
    const savedKey = localStorage.getItem(STORAGE_KEY) || '';
    if (savedKey) {
      window.HOME_DASHBOARD_CALENDAR_KEY = savedKey;
      setTimeout(() => {
        if (typeof loadCalendarFeed === 'function') loadCalendarFeed();
      }, 1200);
    }
  } catch (_) {}

  window.f1SessionName = function (title) {
    const t = String(title || '').trim();
    if (/^FP1\s*:/i.test(t)) return 'FP1';
    if (/^FP2\s*:/i.test(t)) return 'FP2';
    if (/^FP3\s*:/i.test(t)) return 'FP3';
    if (/^SRQ\s*:/i.test(t)) return 'Sprint Qual.';
    if (/^SR\s*:/i.test(t)) return 'Sprint';
    if (/^Q\s*:/i.test(t)) return 'Qualifying';
    if (/^GP\s*:/i.test(t)) return 'Race';
    if (/free practice 1|practice 1|\bfp1\b/i.test(t)) return 'FP1';
    if (/free practice 2|practice 2|\bfp2\b/i.test(t)) return 'FP2';
    if (/free practice 3|practice 3|\bfp3\b/i.test(t)) return 'FP3';
    if (/sprint shootout|sprint qualifying/i.test(t)) return 'Sprint Qual.';
    if (/\bsprint\b/i.test(t)) return 'Sprint';
    if (/qualifying|\bquali\b/i.test(t)) return 'Qualifying';
    if (/\brace\b/i.test(t)) return 'Race';
    return 'Session';
  };

  window.f1WeekendName = function (title) {
    let t = String(title || '').trim();
    t = t.replace(/^(FP1|FP2|FP3|SRQ|SR|Q|GP)\s*:\s*/i, '');
    t = t.replace(/^Formula\s*1\s*/i, '');
    t = t.replace(/^F1\s*/i, '');
    t = t.replace(/^20\d{2}\s+/i, '');
    t = t.replace(/\s+/g, ' ').trim();
    const gp = t.match(/(.+?Grand Prix)/i);
    if (gp) return gp[1].replace(/\b\w/g, c => c.toUpperCase());
    return t || 'Grand Prix Weekend';
  };

  window.renderSports = function () {
    const box = document.getElementById('sports');
    if (!box) return;
    box.innerHTML = '';

    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const upcoming = sportsEvents
      .filter(e => !e.start || new Date(e.start) >= cutoff)
      .sort((a, b) => (a.start ? new Date(a.start) : a.date) - (b.start ? new Date(b.start) : b.date));

    const f1 = upcoming.filter(e => e.sport === 'F1' || e.calendar === 'F1').slice(0, 5);
    const f1Card = document.createElement('div');
    f1Card.className = 'sport-card f1-card';

    if (f1.length) {
      const weekend = window.f1WeekendName(f1[0].title);
      f1Card.innerHTML = `
        <div class="sport-head compact-f1-head">
          <div class="sport-logo f1-logo" aria-label="Formula 1"></div>
          <div>
            <div class="sport-name">Formula 1</div>
            <div class="sport-subtitle">${weekend}</div>
          </div>
        </div>
        <div class="f1-sessions compact-f1-sessions">
          ${f1.map(e => `
            <div class="f1-session compact-f1-session">
              <b>${window.f1SessionName(e.title)}</b>
              <strong>${e.time || 'TBD'}</strong>
              <span>${e.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            </div>`).join('')}
        </div>`;
    } else {
      f1Card.innerHTML = `
        <div class="sport-head compact-f1-head">
          <div class="sport-logo f1-logo" aria-label="Formula 1"></div>
          <div>
            <div class="sport-name">Formula 1</div>
            <div class="sport-subtitle">Calendar linked • no upcoming weekend</div>
          </div>
        </div>`;
    }
    box.appendChild(f1Card);

    const otherTitle = document.createElement('div');
    otherTitle.className = 'other-sports-title';
    otherTitle.textContent = 'Other Sports';
    box.appendChild(otherTitle);

    [
      ['PSU Football', 'Schedule feed coming next'],
      ['PSU Wrestling', 'Schedule feed coming next']
    ].forEach(([label, subtitle]) => {
      const card = document.createElement('div');
      card.className = 'sport-card other-sport-card';
      card.innerHTML = `
        <div class="other-sport-row">
          <div class="other-sport-accent"></div>
          <div>
            <div class="sport-name">${label}</div>
            <div class="sport-subtitle">${subtitle}</div>
          </div>
        </div>`;
      box.appendChild(card);
    });
  };

  let lastHealthy = Date.now();
  const originalStatus = window.setCalendarStatus;
  window.setCalendarStatus = function (message) {
    if (/Calendar updated|Calendar connected/i.test(String(message))) lastHealthy = Date.now();
    if (typeof originalStatus === 'function') originalStatus(message);
  };

  window.addEventListener('online', () => {
    setTimeout(() => {
      if (typeof loadCalendarFeed === 'function') loadCalendarFeed();
      if (typeof loadWeather === 'function') loadWeather();
    }, 1500);
  });

  setInterval(() => {
    if (navigator.onLine && Date.now() - lastHealthy > 10 * 60 * 1000) {
      if (typeof loadCalendarFeed === 'function') loadCalendarFeed();
      if (typeof loadWeather === 'function') loadWeather();
    }
  }, 60 * 1000);
})();
