import os
import time
import logging

import pychromecast
from pychromecast.controllers import BaseController

CAST_NAME = os.getenv('CAST_NAME', 'Kitchen TV')
APP_ID = os.getenv('CAST_APP_ID', '03E19645')
DASHBOARD_KEY = os.getenv('DASHBOARD_KEY', '')
NAMESPACE = 'urn:x-cast:com.home.dashboard.config'
CHECK_SECONDS = int(os.getenv('CHECK_SECONDS', '15'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('dashboard-watchdog')


class DashboardController(BaseController):
    def __init__(self):
        super().__init__(NAMESPACE, supporting_app_id=APP_ID)

    def receive_message(self, message, data):
        log.info('Receiver message: %s', data)
        return True

    def configure(self):
        if DASHBOARD_KEY:
            self.send_message({'type': 'calendar-config', 'key': DASHBOARD_KEY})


def find_cast():
    casts, browser = pychromecast.get_listed_chromecasts(
        friendly_names=[CAST_NAME],
        discovery_timeout=10,
    )
    return (casts[0] if casts else None), browser


def ensure_dashboard():
    cast = None
    browser = None
    try:
        cast, browser = find_cast()
        if cast is None:
            log.info('%s not visible yet', CAST_NAME)
            return

        cast.wait(timeout=12)
        current = cast.app_id
        log.info('%s online, current app: %s', CAST_NAME, current)

        if current != APP_ID:
            log.info('Launching Home Dashboard (%s)', APP_ID)
            cast.start_app(APP_ID, force_launch=True, timeout=15)
            time.sleep(3)

        controller = DashboardController()
        cast.register_handler(controller)
        time.sleep(1)
        controller.configure()
        log.info('Home Dashboard is running')
    except Exception as exc:
        log.warning('Watchdog cycle failed: %s', exc)
    finally:
        try:
            if cast is not None:
                cast.disconnect(timeout=2)
        except Exception:
            pass
        try:
            if browser is not None:
                browser.stop_discovery()
        except Exception:
            pass


def main():
    log.info('Watching %s for dashboard app %s', CAST_NAME, APP_ID)
    if not DASHBOARD_KEY:
        log.warning('DASHBOARD_KEY is not set. The receiver can still launch, but calendar configuration will rely on the key saved on the Chromecast.')

    while True:
        ensure_dashboard()
        time.sleep(CHECK_SECONDS)


if __name__ == '__main__':
    main()
