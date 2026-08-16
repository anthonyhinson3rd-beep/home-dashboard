# Google Calendar feed setup

This dashboard uses a tiny Google Apps Script web app as a read-only calendar feed. No Supabase is required.

## How calendar selection works

The calendars shown on the TV are controlled by `DASHBOARD_CALENDARS` in `Code.gs`.

Each entry has:

- `id`: Google Calendar ID
- `label`: name shown on the TV
- `color`: event color on the TV
- `enabled`: true/false toggle

Your spouse does not need to connect her calendar to ChatGPT. She can simply share her Google Calendar with the Google account that owns the Apps Script. Once shared, add her calendar ID to `DASHBOARD_CALENDARS`.

## Deploy

1. Go to https://script.google.com and create a new project named `Home Dashboard Calendar Feed`.
2. Replace the default code with the contents of `Code.gs`.
3. Set the Apps Script project timezone to `America/New_York`.
4. Replace `REPLACE_WITH_A_LONG_RANDOM_KEY` with a long random secret string.
5. Deploy > New deployment > Web app.
6. Execute as: Me.
7. Who has access: Anyone.
8. Authorize read access to Google Calendar when prompted.
9. Copy the `/exec` deployment URL.

The TV receiver will eventually use a URL like:

`receiver.html?feed=YOUR_APPS_SCRIPT_EXEC_URL&key=YOUR_RANDOM_KEY`

The key should not be committed to the public GitHub repository.

## Adding Megan's calendar

In Google Calendar on Megan's account, share the desired calendar with the Google account that owns the Apps Script and grant at least `See all event details`.

Then open that calendar's Settings > Integrate calendar and copy its Calendar ID. Add it to `DASHBOARD_CALENDARS` in Apps Script and redeploy/update the web app.
