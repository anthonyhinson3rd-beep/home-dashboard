const CONFIG = {
  locationName: 'Blacksburg, VA',
  latitude: 37.2296,
  longitude: -80.4139,
  timezone: 'America/New_York',
  calendarFeedUrl: 'https://script.google.com/macros/s/AKfycbyKgHqynYULXBm8FCTn8FdsY0EvL3rjyfYk4kI_hTUWgghhzGIt3vABik8QfrD9uyBklg/exec'
};

const CALENDAR_COLORS = {
  Shared: '#ffc21c',
  Anthony: '#168cff',
  Megan: '#6fca3c',
  Other: '#9b72e8'
};

const sampleEvents = [
  { offset: 0, time: '', title: 'Household day', calendar: 'Shared', allDay: true },
  { offset: 0, time: '6:30 PM', title: 'Dinner', calendar: 'Shared', allDay: false },
  { offset: 1, time: '8:00 AM', title: 'Morning appointment', calendar: 'Anthony', allDay: false },
  { offset: 2, time: '5:30 PM', title: 'Workout', calendar: 'Megan', allDay: false },
  { offset: 4, time: '7:00 PM', title: 'Plans together', calendar: 'Other', allDay: false }
];

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function eventDate(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

function eventColor(event) {
  return event.color || CALENDAR_COLORS[event.calendar] || CALENDAR_COLORS.Other;
}

function formatRangeTitle(start, end) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const startText = start.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: sameYear ? undefined : 'numeric'
  });
  const endText = end.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
  return `${startText} – ${endText}`;
}

let events = sampleEvents.map(event => ({ ...event, date: eventDate(event.offset) }));

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit'
  });
  document.getElementById('weekday').textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
  document.getElementById('date').textContent = now.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
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

    const matches = events
      .filter(e => formatDateKey(e.date) === formatDateKey(date))
      .sort((a, b) => eventSortValue(a) - eventSortValue(b));

    const eventBox = document.createElement('div');
    eventBox.className = 'day-events';

    matches.slice(0, 7).forEach(event => {
      const row = document.createElement('div');
      if (event.allDay) {
        row.className = 'event-row all-day';
        row.style.borderLeftColor = eventColor(event);
        row.textContent = event.title;
      } else {
        row.className = 'event-row';
        row.innerHTML = `
          <div class="event-wrap">
            <span class="event-dot" style="background:${eventColor(event)}"></span>
            <span class="event-time">${event.time}</span>
          </div>
          <span class="event-title">${event.title}</span>`;
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

function dayLabel(date, today) {
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (formatDateKey(date) === formatDateKey(today)) return 'Today';
  if (formatDateKey(date) === formatDateKey(tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
    row.innerHTML = `
      <div class="agenda-date">
        <span class="agenda-dot" style="background:${eventColor(event)}"></span>${leftTime}
      </div>
      <div><div class="agenda-title">${event.title}</div><div class="agenda-sub">${event.calendar}</div></div>`;
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

  const future = events
    .filter(event => event.date >= today)
    .slice()
    .sort((a, b) => {
      const dateDiff = a.date - b.date;
      return dateDiff || eventSortValue(a) - eventSortValue(b);
    });

  const todayItems = future.filter(e => formatDateKey(e.date) === formatDateKey(today)).slice(0, 3);
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
    color: item.color || null,
    allDay: Boolean(item.allDay),
    important: Boolean(item.important)
  };
}

function getCalendarFeedSettings() {
  const params = new URLSearchParams(location.search);
  return {
    feed: params.get('feed') || CONFIG.calendarFeedUrl,
    key: params.get('key') || ''
  };
}

async function loadCalendarFeed() {
  const { feed, key } = getCalendarFeedSettings();
  if (!feed) return;

  const callbackName = `homeDashboardCalendar_${Date.now()}`;
  const script = document.createElement('script');
  const separator = feed.includes('?') ? '&' : '?';

  try {
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Calendar feed timed out')), 12000);
      window[callbackName] = payload => {
        clearTimeout(timeout);
        resolve(payload);
      };
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Calendar feed failed to load'));
      };
      script.src = `${feed}${separator}callback=${encodeURIComponent(callbackName)}&key=${encodeURIComponent(key)}`;
      document.head.appendChild(script);
    });

    if (!result || !Array.isArray(result.events)) throw new Error('Calendar feed returned invalid data');
    if (result.error) throw new Error(`Calendar feed: ${result.error}`);
    events = result.events.map(normalizeFeedEvent);
    renderCalendar();
    renderAgenda();
  } catch (error) {
    document.getElementById('status').textContent = `Calendar: ${error.message}`;
    console.error(error);
  } finally {
    delete window[callbackName];
    script.remove();
  }
}

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
  const params = new URLSearchParams({
    latitude: CONFIG.latitude,
    longitude: CONFIG.longitude,
    current: 'temperature_2m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    temperature_unit: 'fahrenheit',
    timezone: CONFIG.timezone,
    forecast_days: '5'
  });

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
      item.innerHTML = `
        <div class="forecast-label">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
        <div class="forecast-icon">${info.icon}</div>
        <div class="forecast-temp">${Math.round(data.daily.temperature_2m_max[i])}° / ${Math.round(data.daily.temperature_2m_min[i])}°</div>`;
      forecast.appendChild(item);
    });
    document.getElementById('status').textContent = `Weather updated: ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } catch (error) {
    document.getElementById('weatherText').textContent = 'Weather unavailable';
    document.getElementById('status').textContent = 'Dashboard online • weather retrying';
    console.error(error);
  }
}

updateClock();
renderCalendar();
renderAgenda();
loadCalendarFeed();
loadWeather();
setInterval(updateClock, 1000);
setInterval(loadWeather, 15 * 60 * 1000);
setInterval(loadCalendarFeed, 5 * 60 * 1000);
setInterval(() => {
  renderCalendar();
  renderAgenda();
}, 5 * 60 * 1000);
