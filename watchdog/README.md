# Home Dashboard Fire TV Watchdog

This watchdog keeps the Vega Home Dashboard convenient without hijacking normal TV use.

Behavior:

- If Home Dashboard is already visible, do nothing.
- If Fire TV Home is visible, wait 60 seconds and then return to Home Dashboard.
- If another app is visible (Ring, Netflix, Disney+, YouTube, Prime Video, Settings, etc.), leave it alone.
- If Home Dashboard is no longer running when it is time to return, relaunch it.
- The current dashboard lifecycle instance ID is discovered dynamically, so reboot/relaunch ID changes are handled automatically.

Detected components on this Fire TV:

- Dashboard: `com.amazondeveloper.homedashboard.main`
- Fire TV Home: `com.amazon.smptlighthouse.launcher.main`

## Requirements

The machine running this script needs the Amazon Vega CLI installed and must be able to reach the Fire TV over the LAN. The Fire TV must remain in Developer Mode.

No third-party Python packages are required.

## Run

From the repository root:

```bash
python3 watchdog/dashboard_watchdog.py
```

Defaults:

- Fire TV IP: `192.168.0.216`
- VDA port: `5555`
- check interval: `10` seconds
- return-from-Home delay: `60` seconds

All can be overridden with environment variables:

```bash
FIRE_TV_IP=192.168.0.216 \
CHECK_SECONDS=10 \
HOME_RETURN_SECONDS=60 \
python3 watchdog/dashboard_watchdog.py
```

## Important limitation

The watchdog itself must run on something that stays powered on. Running it inside the Ubuntu VM is fine for testing, but it will stop when the laptop/VM is off. For true appliance-style persistence, run the same script on an always-on Linux computer, mini PC, Raspberry Pi, or similar host with the Vega CLI available.
