"""Run the unchanged network-denying fixtures in exactly two isolated slots.

Each fixture owns its existing artifact directory and a separate Chromium process.
Their localhost:8080 pages are intercepted inside nonpersistent browser contexts;
only CSS reads reach the one shared Vite server. Never increase this worker cap
without reassessing browser memory, fixture output paths, and shared resources.
"""
import json
import os
from pathlib import Path
import signal
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass


MAX_WORKERS = 2
FIXTURE_TIMEOUT_SECONDS = 180
FIXTURE_SPECS = (
    ('employee-invite-ui', 'employee-invite-isolated'),
    ('complex-authoring-ui', 'complex-authoring-isolated'),
    ('home-preferences-ui', 'home-preferences-isolated'),
    ('property-editor-ui', 'property-editor-isolated'),
    ('admin-review-queues', 'admin-review-queues-isolated'),
    ('moderation-queue-ui', 'moderation-queue-isolated'),
    ('ui-backlog-salvage', 'ui-backlog-isolated'),
    ('pms-dashboard-ui', 'pms-dashboard-isolated'),
    ('mc-workspace-ui', 'mc-workspace-isolated'),
    ('mc-workspace-forms-ui', 'mc-workspace-forms'),
    ('services-discovery-ui', 'services-discovery-isolated'),
    ('services-home-alias-ui', 'services-home-alias-isolated'),
    ('trip-planner-ui', 'trip-planner-isolated'),
    ('unified-property-search-ui', 'unified-property-search-isolated'),
    ('bookings-list-ui', 'bookings-list-isolated'),
    ('pms-detail-ui', 'pms-detail-isolated'),
    ('calendar-ui', 'calendar-isolated'),
    ('today-ui', 'today-isolated'),
    ('property-browse-ui', 'property-browse-isolated'),
    ('home-search-ui', 'home-search-isolated'),
    ('homepage-galleries-en-ui', 'homepage-galleries-en-isolated'),
    ('homepage-galleries-ru-ui', 'homepage-galleries-ru-isolated'),
    ('homepage-galleries-th-ui', 'homepage-galleries-th-isolated'),
    ('guest-complex-ui', 'guest-complex-isolated'),
    ('shared-surfaces-ui', 'shared-surfaces-isolated'),
)


@dataclass(frozen=True)
class Fixture:
    script: Path
    output: Path


def stop_process_group(process):
    # Node's synchronous Python child can have Chromium grandchildren. Killing
    # only Node would leak browsers and exceed the two-slot resource bound.
    try:
        os.killpg(process.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    process.wait()


def run_fixture(fixture, timeout_seconds=FIXTURE_TIMEOUT_SECONDS, executable='node'):
    started = time.monotonic()
    result = {'fixture': str(fixture.script), 'outcome': 'FAIL', 'exit_code': None}
    try:
        fixture.output.mkdir(parents=True, exist_ok=True)
        evidence = fixture.output / 'results.json'
        # An earlier successful run must never satisfy this run's evidence gate.
        evidence.unlink(missing_ok=True)
        with (fixture.output / 'fixture.log').open('w') as log:
            process = subprocess.Popen(
                [executable, str(fixture.script)], stdout=log, stderr=subprocess.STDOUT,
                start_new_session=True,
                # Inherit NODE_OPTIONS and all synthetic configuration unchanged.
            )
            try:
                result['exit_code'] = process.wait(timeout=timeout_seconds)
            except subprocess.TimeoutExpired:
                result.update(exit_code=124, error=f'Timed out after {timeout_seconds}s')
            finally:
                stop_process_group(process)
        if 'error' not in result:
            if result['exit_code'] != 0:
                result['error'] = f"Command exited {result['exit_code']}"
            else:
                rows = json.loads(evidence.read_text())
                if not isinstance(rows, list) or not rows or not all(isinstance(row, dict) and row for row in rows):
                    raise ValueError('results.json must contain a nonempty list of result objects')
                result.update(outcome='PASS', result_count=len(rows))
    except Exception as error:
        result['error'] = f'{type(error).__name__}: {error}'
    result['duration_seconds'] = round(time.monotonic() - started, 3)
    return result


def suite_succeeded(fixtures, results):
    expected = [str(fixture.script) for fixture in fixtures]
    actual = [result.get('fixture') for result in results]
    return (
        bool(expected) and len(set(expected)) == len(expected)
        and len(actual) == len(expected) and set(actual) == set(expected)
        and all(result.get('outcome') == 'PASS' for result in results)
    )


def run_suite(fixtures, evidence_root, timeout_seconds=FIXTURE_TIMEOUT_SECONDS, executable='node'):
    if len({fixture.script.resolve() for fixture in fixtures}) != len(fixtures):
        raise ValueError('Duplicate fixture scripts are not isolated')
    if len({fixture.output.resolve() for fixture in fixtures}) != len(fixtures):
        raise ValueError('Fixture artifact directories must be unique')
    evidence_root.mkdir(parents=True, exist_ok=True)
    results = []
    with (evidence_root / 'fixture-status.txt').open('w') as status:
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
            pending = {
                pool.submit(run_fixture, fixture, timeout_seconds, executable): fixture
                for fixture in fixtures
            }
            for future in as_completed(pending):
                fixture = pending[future]
                try:
                    result = future.result()
                except Exception as error:
                    result = {'fixture': str(fixture.script), 'outcome': 'FAIL', 'error': str(error)}
                try:
                    (fixture.output / 'runner-result.json').write_text(json.dumps(result, indent=2))
                except OSError as error:
                    result.update(outcome='FAIL', error=f'Cannot record fixture evidence: {error}')
                results.append(result)
                line = f"{fixture.script}: {result['outcome']}"
                if result.get('error'):
                    line += f" ({result['error']})"
                print(line, flush=True)
                status.write(line + '\n')
                status.flush()
                # Persist each completion early, including crashes and timeouts.
                (evidence_root / 'fixture-results.json').write_text(json.dumps(results, indent=2))
    return suite_succeeded(fixtures, results)


def verify_homepage_matrix(evidence_root):
    # Sharding changes execution size, never the required responsive/locale matrix.
    widths = [320, 360, 375, 390, 430, 768, 1440, 1920]
    expected = {(lang, width, 'data') for lang in ['en', 'ru', 'th'] for width in widths}
    expected |= {('en', 390, state) for state in ['empty', 'error', 'loading']}
    actual = []
    for lang in ['en', 'ru', 'th']:
        rows = json.loads((evidence_root / f'homepage-galleries-{lang}-isolated' / 'results.json').read_text())
        if not isinstance(rows, list):
            raise ValueError('Gallery shard evidence must be a result list')
        for row in rows:
            if row.get('language') != lang or row.get('pageOverflow') is not False:
                raise ValueError('Gallery shard has wrong language or missing layout assertion')
            actual.append((row.get('language'), row.get('width'), row.get('state')))
    if len(actual) != len(expected) or len(set(actual)) != len(actual) or set(actual) != expected:
        raise ValueError(f'Incomplete or duplicate homepage matrix: expected {len(expected)}, got {len(actual)}')
    return {'outcome': 'PASS', 'dataCases': 24, 'stateCases': 3, 'total': len(actual), 'workers': MAX_WORKERS, 'perFixtureTimeout': FIXTURE_TIMEOUT_SECONDS}


if __name__ == '__main__':
    evidence_root = Path('/tmp/browser')
    fixtures = [Fixture(Path(f'scripts/qa/{name}.mjs'), evidence_root / output) for name, output in FIXTURE_SPECS]
    passed = run_suite(fixtures, evidence_root)
    try:
        matrix = verify_homepage_matrix(evidence_root)
    except Exception as error:
        matrix = {'outcome': 'FAIL', 'error': str(error)}
        passed = False
    (evidence_root / 'homepage-matrix-coverage.json').write_text(json.dumps(matrix, indent=2))
    print(json.dumps({'homepageMatrix': matrix}), flush=True)
    raise SystemExit(0 if passed else 1)
