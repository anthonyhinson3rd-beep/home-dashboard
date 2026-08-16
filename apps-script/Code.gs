const DASHBOARD_KEY = 'HD-8f4kQ29vM7xP2L6cN5sW';

// Household calendar priority: lower number = shown first when a day is crowded.
const DASHBOARD_CALENDARS = [
  {
    id: 'faea0a802e813984d5ab49f06ab5f2803099fb5f64b1d7b48085b54d7457fdb6@group.calendar.google.com',
    label: 'Love',
    color: '#ef4f78',
    priority: 1,
    enabled: true
  },
  {
    id: 'primary',
    label: 'Anthony',
    color: '#2f80ed',
    priority: 2,
    enabled: true
  },
  {
    id: 'hammey2525@gmail.com',
    label: 'Megan',
    color: '#39a96b',
    priority: 3,
    enabled: true
  },
  {
    id: '8e409d0a3e975ceafcfb2de57cc10ca8425f94e3f13a1b3a9d888a3ebfa2e442@group.calendar.google.com',
    label: 'Hamm',
    color: '#8d63d6',
    priority: 4,
    enabled: true
  }
];

// Sports are kept out of the main household calendar and shown in the small sports panel.
const SPORTS_CALENDARS = [
  {
    id: 'ekqk1nbdusr1baon1ic42oeeik@group.calendar.google.com',
    label: 'F1',
    color: '#e10600',
    enabled: true
  }
  // Add PSU Football and PSU Wrestling calendar IDs here later.
];

function doGet(e) {
  const callback = sanitizeCallback_(e.parameter.callback || 'callback');
  const suppliedKey = e.parameter.key || '';

  if (suppliedKey !== DASHBOARD_KEY) {
    return javascriptResponse_(callback, { error: 'unauthorized', events: [], sportsEvents: [] });
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 35);

  const events = readCalendars_(DASHBOARD_CALENDARS, start, end, false);
  const sportsEvents = readCalendars_(SPORTS_CALENDARS, now, end, true);

  events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
    return (a.start || '').localeCompare(b.start || '');
  });

  sportsEvents.sort((a, b) => (a.start || a.date).localeCompare(b.start || b.date));

  return javascriptResponse_(callback, {
    generatedAt: new Date().toISOString(),
    events: events,
    sportsEvents: sportsEvents
  });
}

function readCalendars_(configs, start, end, sportsMode) {
  const output = [];

  configs.filter(c => c.enabled).forEach(config => {
    const calendar = config.id === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(config.id);

    if (!calendar) return;

    calendar.getEvents(start, end).forEach(event => {
      const allDay = event.isAllDayEvent();
      const eventStart = event.getStartTime();
      const eventEnd = event.getEndTime();
      output.push({
        title: event.getTitle(),
        calendar: config.label,
        sport: sportsMode ? config.label : null,
        color: config.color,
        priority: config.priority || 99,
        allDay: allDay,
        important: allDay,
        date: Utilities.formatDate(eventStart, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        start: allDay ? null : eventStart.toISOString(),
        end: allDay ? null : eventEnd.toISOString(),
        time: allDay ? '' : Utilities.formatDate(eventStart, Session.getScriptTimeZone(), 'h:mm a')
      });
    });
  });

  return output;
}

function javascriptResponse_(callback, payload) {
  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(payload)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function sanitizeCallback_(value) {
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(value) ? value : 'callback';
}
