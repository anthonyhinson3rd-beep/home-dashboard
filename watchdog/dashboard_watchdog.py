import os
import re
import subprocess
import time
from datetime import datetime

FIRE_TV_IP = os.getenv("FIRE_TV_IP", "192.168.0.216")
FIRE_TV_PORT = os.getenv("FIRE_TV_PORT", "5555")
APP_NAME = os.getenv("DASHBOARD_APP", "com.amazondeveloper.homedashboard")
DASHBOARD_COMPONENT = os.getenv(
    "DASHBOARD_COMPONENT", "com.amazondeveloper.homedashboard.main"
)
HOME_COMPONENT = os.getenv(
    "HOME_COMPONENT", "com.amazon.smplighthouse.launcher.main"
)
CHECK_SECONDS = int(os.getenv("CHECK_SECONDS", "10"))
HOME_RETURN_SECONDS = int(os.getenv("HOME_RETURN_SECONDS", "60"))


def log(message):
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} {message}", flush=True)


def run(command, timeout=20):
    return subprocess.run(
        command,
        shell=True,
        text=True,
        capture_output=True,
        timeout=timeout,
    )


def ensure_connected():
    result = run(f"vega exec vda shell vlcm list", timeout=12)
    if result.returncode == 0:
        return True

    log("Fire TV connection is unavailable; reconnecting...")
    result = run(
        f"vega exec vda connect {FIRE_TV_IP}:{FIRE_TV_PORT}", timeout=15
    )
    if result.returncode != 0:
        log(f"Reconnect failed: {(result.stderr or result.stdout).strip()}")
        return False
    return True


def get_lifecycle():
    result = run("vega exec vda shell vlcm list", timeout=12)
    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout).strip())
    return result.stdout


def visible_components(output):
    visible = []
    for line in output.splitlines():
        if "VISIBLE" in line and "NOT_VISIBLE" not in line:
            name = line.strip().split()[0] if line.strip() else ""
            if name:
                visible.append(name)
    return visible


def dashboard_instance(output):
    for line in output.splitlines():
        if DASHBOARD_COMPONENT not in line:
            continue
        # Typical Vega vlcm columns include package, type, pid, id, state.
        # Pull the numeric fields and use the final numeric field as instance id.
        numbers = re.findall(r"\b\d+\b", line)
        if numbers:
            return numbers[-1]
    return None


def launch_dashboard():
    log("Launching Home Dashboard...")
    result = run(f"vega device launch-app --appName {APP_NAME}", timeout=20)
    if result.returncode != 0:
        log(f"Launch failed: {(result.stderr or result.stdout).strip()}")
        return False
    return True


def foreground_dashboard(instance_id):
    log(f"Returning Home Dashboard to foreground (instance {instance_id})...")
    result = run(
        f"vega exec vda shell vlcm trigger-app foreground --inst {instance_id}",
        timeout=15,
    )
    if result.returncode != 0:
        log(f"Foreground failed: {(result.stderr or result.stdout).strip()}")
        return False
    return True


def main():
    log("Smart Fire TV dashboard watchdog started")
    log(f"Dashboard component: {DASHBOARD_COMPONENT}")
    log(f"Fire TV Home component: {HOME_COMPONENT}")
    log(
        f"Behavior: leave other apps alone; return from Home after {HOME_RETURN_SECONDS}s"
    )

    home_since = None

    while True:
        try:
            if not ensure_connected():
                time.sleep(CHECK_SECONDS)
                continue

            output = get_lifecycle()
            visible = visible_components(output)
            instance = dashboard_instance(output)

            if DASHBOARD_COMPONENT in visible:
                home_since = None
                log("Dashboard is visible")

            elif HOME_COMPONENT in visible:
                if home_since is None:
                    home_since = time.monotonic()
                    log("Fire TV Home is visible; starting return timer")
                elapsed = time.monotonic() - home_since

                if elapsed >= HOME_RETURN_SECONDS:
                    if instance:
                        foreground_dashboard(instance)
                    else:
                        launch_dashboard()
                    home_since = None

            else:
                # Any other visible app is treated as intentional use: Ring,
                # Netflix, Disney+, YouTube, Prime Video, Settings, etc.
                if visible:
                    log("Other app is visible; leaving it alone: " + ", ".join(visible))
                else:
                    log("No visible lifecycle component detected; leaving TV untouched")
                home_since = None

        except Exception as exc:
            log(f"Watchdog cycle failed: {exc}")

        time.sleep(CHECK_SECONDS)


if __name__ == "__main__":
    main()
