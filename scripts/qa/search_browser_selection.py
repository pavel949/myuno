"""Explicit browser contract for the two property-search browser checks only."""
import os
from pathlib import Path


def select_search_browser(bundled_path, *, ci=None, system_path='/usr/bin/chromium'):
    if ci is None:
        ci = os.environ.get('CI', '').lower() not in ('', '0', 'false')
    bundled = Path(bundled_path)
    if bundled.is_file():
        return {'executable_path': str(bundled), 'source': 'playwright-bundled', 'ci': ci}
    if ci:
        raise FileNotFoundError(f'CI requires the installed Playwright Chromium bundle: {bundled}')
    system = Path(system_path)
    if system.is_file():
        return {'executable_path': str(system), 'source': 'local-system-fallback', 'ci': ci}
    raise FileNotFoundError(f'No local Playwright bundle ({bundled}) or system Chromium ({system})')
