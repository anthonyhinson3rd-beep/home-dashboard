const DASHBOARD_KEY = 'REPLACE_WITH_A_LONG_RANDOM_KEY';

// Add or remove calendars here. Your wife does NOT need ChatGPT access.
// She only needs to share her Google Calendar with the Google account that owns this Apps Script.
const DASHBOARD_CALENDARS = [
  {
    id: 'primary',
    label: 'Anthony',
    color: '#168cff',
    enabled: true
  },
  {
    id: 'faea0a802e813984d5ab49f06ab5f2803099fb5f64b1d7b48085b54d7457fdb6@group.calendar.google.com',
    label: 'Shared',
    color: '#ffc21c',
    enabled: true
  }
  // Example for Megan after she shares her calendar with you:
  // {
  //   id: 'her-calendar-id-or-email@example.com',
  //   label: 'Megan',
  //   color: '#6fca3c',
  //   enabled: true
  // }
];

function doGet(e) {
  const callback = sanitizeCallback_(e.parameter.callback || 'callback');
  const suppliedKey = e.parameter.key || '';

  if (suppliedKey !== DASHBOARD_KEY) {
    return javascriptResponse_(callback, { error: 'unauthorized', events: [] });
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 35);

  const events = [];

  DASHBOARD_CALENDARS.filter(c => c.enabled).forEach(config => {
    const calendar = config.id === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(config.id);

    if (!calendar) return;

    calendar.getEvents(start, end).forEach(event => {
      const allDay = event.isAllDayEvent();
      const eventStart = event.getStartTime();
      events.push({
        title: event.getTitle(),
        calendar: config.label,
        color: config.color,
        allDay: allDay,
        important: allDay,
        date: Utilities.formatDate(eventStart, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        start: allDay ? null : eventStart.toISOString(),
        time: allDay ? '' : Utilities.formatDate(eventStart, Session.getScriptTimeZone(), 'h:mm a')
      });
    });
  });

  events.sort((a, b) => {
    const aKey = a.date + (a.allDay ? ' 00:00' : ' ' + a.time);
    const bKey = b.date + (b.allDay ? ' 00:00' : ' ' + b.time);
    return aKey.localeCompare(bKey);
  });

  return javascriptResponse_(callback, {
    generatedAt: new Date().toISOString(),
    events: events
  });
}

function javascriptResponse_(callback, payload) {
  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(payload)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function sanitizeCallback_(value) {
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(value) ? value : 'callback';
}
