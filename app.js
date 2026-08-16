const CONFIG = {
  locationName: 'Blacksburg, VA',
  latitude: 37.2296,
  longitude: -80.4139,
  timezone: 'America/New_York'
};

const CALENDAR_COLORS = {
  Shared: '#ffc21c',
  Anthony: '#168cff',
  Megan: '#7fdc46',
  Other: '#ad7df8'
};

const sampleEvents = [
  { offset: 0, time: '6:30 PM', title: 'Dinner', calendar: 'Shared' },
  { offset: 1, time: '8:00 AM', title: 'Morning appointment', calendar: 'Anthony' },
  { offset: 2, time: '5:30 PM', title: 'Workout', calendar: 'Megan' },
  { offset: 4, time: '7:00 PM', title: 'Plans together', calendar: 'Other' }
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
  return CALENDAR_COLORS[event.calendar] || CALENDAR_COLORS.Other;
}

const events = sampleEvents.map(event => ({ ...event, date: eventDate(event.offset) }));

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

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  document.getElementById('monthTitle').textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  for (let i = 0; i < 42; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const cell = document.createElement('div');
    cell.className = 'day';
    if (date.getMonth() !== month) cell.classList.add('outside');
    if (formatDateKey(date) === formatDateKey(now)) cell.classList.add('today');

    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = date.getDate();
    cell.appendChild(num);

    const matches = events
      .filter(e => formatDateKey(e.date) === formatDateKey(date))
      .sort((a, b) => a.time.localeCompare(b.time));

    const eventBox = document.createElement('div');
    eventBox.className = 'day-events';
    matches.slice(0, 5).forEach(event => {
      const row = document.createElement('div');
      row.className = 'event-row';
      row.innerHTML = `
        <div class="event-wrap">
          <span class="event-dot" style="background:${eventColor(event)}"></span>
          <span class="event-time">${event.time}</span>
        </div>
        <span class="event-title">${event.title}</span>`;
      eventBox.appendChild(row);
    });

    if (matches.length > 5) {
      const more = document.createElement('div');
      more.className = 'more-events';
      more.textContent = `+${matches.length - 5} more`;
      eventBox.appendChild(more);
    }

    cell.appendChild(eventBox);
    grid.appendChild(cell);
  }
}

function renderAgenda() {
  const agenda = document.getElementById('agenda');
  agenda.innerHTML = '';
  events
    .slice()
    .sort((a, b) => a.date - b.date)
    .slice(0, 6)
    .forEach(event => {
      const row = document.createElement('div');
      row.className = 'agenda-item';
      const when = event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      row.innerHTML = `
        <div class="agenda-date">
          <span class="agenda-dot" style="background:${eventColor(event)}"></span>${when}<br>
          <span style="padding-left:16px">${event.time}</span>
        </div>
        <div><div class="agenda-title">${event.title}</div><div class="agenda-sub">${event.calendar}</div></div>`;
      agenda.appendChild(row);
    });
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
loadWeather();
setInterval(updateClock, 1000);
setInterval(loadWeather, 15 * 60 * 1000);
setInterval(() => {
  renderCalendar();
  renderAgenda();
}, 5 * 60 * 1000);
