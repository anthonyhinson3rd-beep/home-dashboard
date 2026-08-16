const CONFIG = {
  locationName: 'Blacksburg, VA',
  latitude: 37.2296,
  longitude: -80.4139,
  timezone: 'America/New_York',
  calendarFeedUrl: 'https://script.google.com/macros/s/AKfycbyKgHqynYULXBm8FCTn8FdsY0EvL3rjyfYk4kI_hTUWgghhzGIt3vABik8QfrD9uyBklg/exec'
};

const CALENDAR_COLORS = {
  Love: '#ef4f78',
  Anthony: '#2f80ed',
  Megan: '#39a96b',
  Hamm: '#8d63d6',
  Other: '#7d8ea3'
};

const CALENDAR_PRIORITY = { Love: 1, Anthony: 2, Megan: 3, Hamm: 4, Other: 99 };
let events = [];
let sportsEvents = [];

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function eventColor(event) {
  return event.color || CALENDAR_COLORS[event.calendar] || CALENDAR_COLORS.Other;
}

function eventPriority(event) {
  return Number.isFinite(event.priority) ? event.priority : (CALENDAR_PRIORITY[event.calendar] || 99);
}

function formatRangeTitle(start, end) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const startText = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: sameYear ? undefined : 'numeric' });
  const endText = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `${startText} – ${endText}`;
}

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  document.getElementById('weekday').textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
  document.getElementById('date').textContent = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  document.getElementById('locationLabel').textContent = CONFIG.locationName;
}

function eventSortValue(event) {
  if (event.allDay) return -1;
  if (event.start) return new Date(event.start).getTime();
  const match = (event.time || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let h = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(match[2]);
}

function compareEvents(a, b) {
  const p = eventPriority(a) - eventPriority(b);
  if (p) return p;
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  return eventSortValue(a) - eventSortValue(b);
}

function renderCalendar() {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 27);
  document.getElementById('monthTitle').textContent = formatRangeTitle(start, end);
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  for (let i = 0; i < 28; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const cell = document.createElement('div');
    cell.className = 'day';
    if (date.getMonth() !== now.getMonth()) cell.classList.add('outside');
    if (formatDateKey(date) === formatDateKey(now)) cell.classList.add('today');

    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = date.getDate();
    cell.appendChild(num);

    const matches = events.filter(e => formatDateKey(e.date) === formatDateKey(date)).sort(compareEvents);
    const eventBox = document.createElement('div');
    eventBox.className = 'day-events';

    matches.slice(0, 7).forEach(event => {
      const row = document.createElement('div');
      if (event.allDay) {
        row.className = 'event-row all-day';
        row.style.borderLeftColor = eventColor(event);
        row.style.background = `${eventColor(event)}18`;
        row.textContent = event.title;
      } else {
        row.className = 'event-row';
        row.innerHTML = `<div class="event-wrap"><span class="event-dot" style="background:${eventColor(event)}"></span><span class="event-time">${event.time}</span></div><span class="event-title">${event.title}</span>`;
      }
      eventBox.appendChild(row);
    });

    if (matches.length > 7) {
      const more = document.createElement('div');
      more.className = 'more-events';
      more.textContent = `+${matches.length - 7} more`;
      eventBox.appendChild(more);
    }

    cell.appendChild(eventBox);
    grid.appendChild(cell);
  }
}

function appendAgendaSection(container, title, items) {
  if (!items.length) return;
  const heading = document.createElement('div');
  heading.className = 'agenda-section-title';
  heading.textContent = title;
  container.appendChild(heading);
  items.forEach(event => {
    const row = document.createElement('div');
    row.className = 'agenda-item';
    const leftTime = event.allDay ? 'All day' : event.time;
    row.innerHTML = `<div class="agenda-date"><span class="agenda-dot" style="background:${eventColor(event)}"></span>${leftTime}</div><div><div class="agenda-title">${event.title}</div><div class="agenda-sub">${event.calendar}</div></div>`;
    container.appendChild(row);
  });
}

function renderAgenda() {
  const agenda = document.getElementById('agenda');
  agenda.innerHTML = '';
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const future = events.filter(event => event.date >= today).slice().sort((a, b) => {
    const dateDiff = a.date - b.date;
    return dateDiff || compareEvents(a, b);
  });

  const todayItems = future.filter(e => formatDateKey(e.date) === formatDateKey(today)).slice(0, 4);
  const tomorrowItems = future.filter(e => formatDateKey(e.date) === formatDateKey(tomorrow)).slice(0, 3);
  const used = new Set([...todayItems, ...tomorrowItems]);
  const important = future.filter(e => !used.has(e) && (e.allDay || e.important)).slice(0, 2);

  appendAgendaSection(agenda, 'Today', todayItems);
  appendAgendaSection(agenda, 'Tomorrow', tomorrowItems);
  appendAgendaSection(agenda, 'Next important', important);

  if (!agenda.children.length) {
    const empty = document.createElement('div');
    empty.className = 'agenda-section-title';
    empty.textContent = 'Nothing upcoming';
    agenda.appendChild(empty);
  }
}

function normalizeFeedEvent(item) {
  const date = item.date ? new Date(`${item.date}T12:00:00`) : new Date(item.start);
  return {
    date,
    start: item.start || null,
    time: item.time || '',
    title: item.title || 'Untitled event',
    calendar: item.calendar || 'Other',
    sport: item.sport || null,
    color: item.color || null,
    priority: Number(item.priority || 99),
    allDay: Boolean(item.allDay),
    important: Boolean(item.important)
  };
}

function renderSports() {
  const box = document.getElementById('sports');
  if (!box) return;
  box.innerHTML = '';

  const now = new Date();
  const upcoming = sportsEvents
    .filter(e => !e.start || new Date(e.start) >= new Date(now.getTime() - 6 * 60 * 60 * 1000))
    .sort((a, b) => (a.start ? new Date(a.start) : a.date) - (b.start ? new Date(b.start) : b.date));

  const nextF1 = upcoming.find(e => e.sport === 'F1' || e.calendar === 'F1');
  const items = [
    { label: 'F1', event: nextF1, color: '#e10600' },
    { label: 'PSU Football', event: null, color: '#17365d' },
    { label: 'PSU Wrestling', event: null, color: '#17365d' }
  ];

  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'sports-row';
    const detail = item.event
      ? `${item.event.date.toLocaleDateString('en-US',{month:'short',day:'numeric'})}${item.event.time ? ' • ' + item.event.time : ''} • ${item.event.title}`
      : 'Calendar not linked yet';
    row.innerHTML = `<span class="sports-badge" style="background:${item.color}"></span><div><div class="sports-label">${item.label}</div><div class="sports-detail">${detail}</div></div>`;
    box.appendChild(row);
  });
}

function getCalendarFeedSettings() {
  const params = new URLSearchParams(location.search);
  return { feed: params.get('feed') || CONFIG.calendarFeedUrl, key: window.HOME_DASHBOARD_CALENDAR_KEY || params.get('key') || '' };
}

function setCalendarStatus(message) {
  const el = document.getElementById('status');
  if (el) el.textContent = message;
}

async function loadCalendarFeed() {
  const { feed, key } = getCalendarFeedSettings();
  if (!feed) return;
  if (!key) {
    setCalendarStatus('Calendar waiting for secure Cast configuration…');
    return;
  }

  const callbackName = `homeDashboardCalendar_${Date.now()}`;
  const script = document.createElement('script');
  const separator = feed.includes('?') ? '&' : '?';

  try {
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('feed timed out')), 12000);
      window[callbackName] = payload => { clearTimeout(timeout); resolve(payload); };
      script.onerror = () => { clearTimeout(timeout); reject(new Error('feed failed to load')); };
      script.src = `${feed}${separator}callback=${encodeURIComponent(callbackName)}&key=${encodeURIComponent(key)}&_=${Date.now()}`;
      document.head.appendChild(script);
    });

    if (result && result.error) throw new Error(result.error);
    if (!result || !Array.isArray(result.events)) throw new Error('invalid feed data');

    events = result.events.map(normalizeFeedEvent);
    sportsEvents = Array.isArray(result.sportsEvents) ? result.sportsEvents.map(normalizeFeedEvent) : [];
    renderCalendar();
    renderAgenda();
    renderSports();
    setCalendarStatus(`Calendar updated ${new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})} • ${events.length} events`);
  } catch (error) {
    setCalendarStatus(`Calendar error: ${error.message}`);
    console.error(error);
  } finally {
    delete window[callbackName];
    script.remove();
  }
}

window.setHomeDashboardCalendarKey = function(key) {
  window.HOME_DASHBOARD_CALENDAR_KEY = String(key || '');
  loadCalendarFeed();
};

function weatherCode(code, isDay = 1) {
  if (code === 0) return { icon: isDay ? '☀️' : '🌙', text: 'Clear' };
  if ([1, 2].includes(code)) return { icon: isDay ? '🌤️' : '☁️', text: 'Partly cloudy' };
  if (code === 3) return { icon: '☁️', text: 'Cloudy' };
  if ([45, 48].includes(code)) return { icon: '🌫️', text: 'Foggy' };
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: '🌦️', text: 'Drizzle' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: '🌧️', text: 'Rain' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: '🌨️', text: 'Snow' };
  if ([95, 96, 99].includes(code)) return { icon: '⛈️', text: 'Thunderstorms' };
  return { icon: '🌡️', text: 'Weather' };
}

async function loadWeather() {
  const params = new URLSearchParams({ latitude: CONFIG.latitude, longitude: CONFIG.longitude, current: 'temperature_2m,weather_code,is_day', daily: 'weather_code,temperature_2m_max,temperature_2m_min', temperature_unit: 'fahrenheit', timezone: CONFIG.timezone, forecast_days: '5' });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error(`Weather HTTP ${response.status}`);
    const data = await response.json();
    const current = weatherCode(data.current.weather_code, data.current.is_day);
    document.getElementById('weatherIcon').textContent = current.icon;
    document.getElementById('weatherTemp').textContent = `${Math.round(data.current.temperature_2m)}°`;
    document.getElementById('weatherText').textContent = current.text;
    const forecast = document.getElementById('forecast');
    forecast.innerHTML = '';
    data.daily.time.forEach((dateString, i) => {
      const date = new Date(`${dateString}T12:00:00`);
      const info = weatherCode(data.daily.weather_code[i]);
      const item = document.createElement('div');
      item.className = 'forecast-day';
      item.innerHTML = `<div class="forecast-label">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div><div class="forecast-icon">${info.icon}</div><div class="forecast-temp">${Math.round(data.daily.temperature_2m_max[i])}° / ${Math.round(data.daily.temperature_2m_min[i])}°</div>`;
      forecast.appendChild(item);
    });
  } catch (error) {
    document.getElementById('weatherText').textContent = 'Weather unavailable';
    console.error(error);
  }
}

updateClock();
renderCalendar();
renderAgenda();
renderSports();
loadCalendarFeed();
loadWeather();
setInterval(updateClock, 1000);
setInterval(loadCalendarFeed, 60 * 1000);
setInterval(loadWeather, 15 * 60 * 1000);
setInterval(() => { renderCalendar(); renderAgenda(); renderSports(); }, 60 * 1000);
