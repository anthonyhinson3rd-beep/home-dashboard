// Dashboard weather location override: Christiansburg, Virginia.
// Keeps the calendar/dashboard logic independent from the weather location.
(() => {
  const latitude = '37.141164';
  const longitude = '-80.407700';
  const nativeFetch = window.fetch.bind(window);

  window.fetch = function(input, init) {
    try {
      const raw = typeof input === 'string' ? input : input.url;
      const url = new URL(raw, window.location.href);
      if (url.hostname === 'api.open-meteo.com') {
        url.searchParams.set('latitude', latitude);
        url.searchParams.set('longitude', longitude);
        input = typeof input === 'string' ? url.toString() : new Request(url.toString(), input);
      }
    } catch (_) {}
    return nativeFetch(input, init);
  };
})();
