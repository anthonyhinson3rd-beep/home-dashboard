# Home Dashboard Chromecast Watchdog

Google Cast Web Receivers are launched by a sender. After a full Chromecast reboot, the receiver does not start itself. This watchdog runs on any always-on computer on the same network and relaunches Home Dashboard whenever Kitchen TV comes back online.

## Environment

Set these environment variables on the host running the watchdog:

- `CAST_NAME=Kitchen TV`
- `CAST_APP_ID=03E19645`
- `DASHBOARD_KEY=<your existing dashboard key>`
- `CHECK_SECONDS=15` (optional)

## Install

```bash
python -m pip install -r requirements.txt
python dashboard_watchdog.py
```

The host must stay powered on and connected to the same LAN/subnet as the Chromecast so mDNS discovery and Cast port 8009 can reach it.

For Windows, configure `dashboard_watchdog.py` to run at sign-in or system startup with Task Scheduler. For Raspberry Pi/Linux, run it as a systemd service.
