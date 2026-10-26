"""Runner contract tests with lightweight subprocesses; never launch a browser."""
import json
import ast
import os
from pathlib import Path, PurePosixPath
import re
import sys
import tempfile
import time
import unittest
from unittest.mock import patch
from types import SimpleNamespace

import browser_fixture_runner as runner


ROOT = Path(__file__).resolve().parents[2]


def declared_fixture_output(source):
    """Resolve supported static declarations with the CI default temporary root."""
    literal = re.search(r"(?m)^\s*const output\s*=\s*(?:process\.env\.(?:HOME_GALLERY_OUTPUT|SHARED_SURFACES_OUTPUT|SERVICES_DISCOVERY_OUTPUT)\s*\|\|\s*)?'([^']+)'\s*;", source)
    if literal:
        return literal.group(1)
    portable = re.search(
        r"(?m)^\s*const output\s*=\s*path\.join\(\s*process\.env\.TEMP\s*\|\|\s*'(/tmp)'\s*,\s*'(browser)'\s*,\s*'([^']+)'\s*\)\s*;",
        source,
    )
    if portable:
        return str(PurePosixPath(*portable.groups()))
    raise AssertionError('Fixture must declare a literal output or the supported portable TEMP/browser path')


class BrowserFixtureRunnerTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='.runner-test-', dir=ROOT)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.events = self.root / 'events.jsonl'

    def fixture(self, name, body='', result='[{"passed": true}]'):
        script = self.root / f'{name}.py'
        output = self.root / name
        script.write_text(
            'import json, os, subprocess, sys, time\nfrom pathlib import Path\n'
            f'output = Path({str(output)!r})\n'
            f'events = Path({str(self.events)!r})\n'
            'def event(kind):\n'
            '    with events.open("a") as stream:\n'
            f'        stream.write(json.dumps({{"name": {name!r}, "kind": kind}}) + "\\n")\n'
            'event("start")\n'
            f'print({name!r}, flush=True)\n'
            + body + '\n'
            + (f'(output / "results.json").write_text({result!r})\n' if result is not None else '')
            + 'event("end")\n'
        )
        return runner.Fixture(script, output)

    def run_suite(self, fixtures, timeout=3):
        return runner.run_suite(fixtures, self.root / 'evidence', timeout, sys.executable)

    def test_all_fixtures_have_their_own_output(self):
        expected = (
            'employee-invite-ui complex-authoring-ui home-preferences-ui property-editor-ui '
            'admin-review-queues moderation-queue-ui ui-backlog-salvage pms-dashboard-ui '
            'mc-workspace-ui mc-workspace-forms-ui services-discovery-ui services-home-alias-ui trip-planner-ui '
            'unified-property-search-ui bookings-list-ui pms-detail-ui calendar-ui today-ui '
            'property-browse-ui home-search-ui homepage-galleries-en-ui homepage-galleries-ru-ui homepage-galleries-th-ui guest-complex-ui shared-surfaces-ui'
        ).split()
        self.assertEqual([name for name, _ in runner.FIXTURE_SPECS], expected)
        self.assertEqual(len({output for _, output in runner.FIXTURE_SPECS}), 25)
        self.assertEqual(runner.MAX_WORKERS, 2)
        self.assertEqual(runner.FIXTURE_TIMEOUT_SECONDS, 180)
        for name, output in runner.FIXTURE_SPECS:
            source = (ROOT / f'scripts/qa/{name}.mjs').read_text(encoding='utf-8')
            actual = declared_fixture_output(source)
            self.assertEqual(actual, f'/tmp/browser/{output}', name)
            shards = {f'homepage-galleries-{lang}-ui': lang for lang in ['en', 'ru', 'th']}
            if name in shards:
                self.assertIn(f"runGalleryShard('{shards[name]}', output)", source)
                self.assertTrue((ROOT / 'scripts/qa/homepage-galleries-ui.py').is_file())
            else:
                self.assertTrue((ROOT / f'scripts/qa/{name}.py').is_file())

    def write_homepage_matrix(self):
        rows = {lang: [{'language': lang, 'width': width, 'state': 'data', 'pageOverflow': False} for width in [320,360,375,390,430,768,1440,1920]] for lang in ['en','ru','th']}
        rows['en'] += [{'language':'en','width':390,'state':state,'pageOverflow':False} for state in ['empty','error','loading']]
        for lang, data in rows.items():
            folder=self.root/f'homepage-galleries-{lang}-isolated';folder.mkdir(exist_ok=True)
            (folder/'results.json').write_text(json.dumps(data))
        return rows

    def test_homepage_shards_retain_the_complete_27_case_matrix(self):
        self.write_homepage_matrix()
        result=runner.verify_homepage_matrix(self.root)
        self.assertEqual((result['dataCases'],result['stateCases'],result['total']),(24,3,27))
        self.assertEqual((result['workers'],result['perFixtureTimeout']),(2,180))

    def test_homepage_matrix_rejects_missing_duplicate_and_wrong_language_results(self):
        for mutation in ['missing','duplicate','wrong-language','missing-layout']:
            with self.subTest(mutation=mutation):
                rows=self.write_homepage_matrix()
                if mutation=='missing':rows['en'].pop()
                if mutation=='duplicate':rows['en'][-1]=rows['en'][0]
                if mutation=='wrong-language':rows['en'][0]['language']='ru'
                if mutation=='missing-layout':rows['en'][0].pop('pageOverflow')
                (self.root/'homepage-galleries-en-isolated/results.json').write_text(json.dumps(rows['en']))
                with self.assertRaises(ValueError):runner.verify_homepage_matrix(self.root)

    def test_output_contract_accepts_portable_paths_but_still_checks_exact_destination(self):
        literal = "const output = '/tmp/browser/moderation-queue-isolated';"
        portable = "const output = path.join(process.env.TEMP || '/tmp', 'browser', 'moderation-queue-isolated');"
        self.assertEqual(declared_fixture_output(literal), declared_fixture_output(portable))
        self.assertNotEqual(declared_fixture_output(portable.replace('moderation-queue-isolated', 'wrong')), declared_fixture_output(literal))
        override = "const output = process.env.SHARED_SURFACES_OUTPUT || '/tmp/browser/shared-surfaces-isolated';"
        self.assertEqual(declared_fixture_output(override), '/tmp/browser/shared-surfaces-isolated')
        with self.assertRaisesRegex(AssertionError, 'Fixture must declare'):
            declared_fixture_output(override.replace('SHARED_SURFACES_OUTPUT', 'ARBITRARY_OUTPUT'))
        with self.assertRaisesRegex(AssertionError, 'Fixture must declare'):
            declared_fixture_output('const output = arbitraryPath();')

    def test_moderation_reader_assertion_checks_page_without_shadowing_browser_page(self):
        source = (ROOT / 'scripts/qa/moderation-queue-ui.py').read_text(encoding='utf-8')
        helper = next(node for node in ast.parse(source).body if isinstance(node, ast.AsyncFunctionDef) and node.name == 'assert_last_read')
        namespace = {}
        exec(compile(ast.Module(body=[helper], type_ignores=[]), '<read-assertion>', 'exec'), namespace)
        async def evaluate(_script):
            return {'source': 'listing', 'page': 0, 'queue': 'pending'}
        page = SimpleNamespace(evaluate=evaluate)
        # The synthetic evaluate returns immediately; drive the real helper
        # directly without an OS event loop, subprocess or browser.
        with self.assertRaises(StopIteration):
            namespace['assert_last_read'](page, source='listing', page=0, queue='pending').send(None)
        with self.assertRaises(AssertionError):
            namespace['assert_last_read'](page, source='listing', page=1).send(None)

    def test_exactly_two_slots_and_all_fixtures_finish_with_isolated_logs(self):
        fixtures = [self.fixture(f'pass-{index}', 'time.sleep(0.2)') for index in range(5)]
        self.assertTrue(self.run_suite(fixtures))
        active, peak, started = 0, 0, []
        for event in map(json.loads, self.events.read_text().splitlines()):
            active += 1 if event['kind'] == 'start' else -1
            peak = max(peak, active)
            if event['kind'] == 'start':
                started.append(event['name'])
        self.assertEqual((active, peak, len(started)), (0, 2, 5))
        results = json.loads((self.root / 'evidence/fixture-results.json').read_text())
        self.assertEqual(len(results), len(fixtures))
        for fixture in fixtures:
            self.assertEqual((fixture.output / 'fixture.log').read_text().strip(), fixture.script.stem)
            self.assertEqual(json.loads((fixture.output / 'runner-result.json').read_text())['outcome'], 'PASS')

    def test_failure_does_not_skip_other_fixtures_or_pass_the_aggregate(self):
        fixtures = [self.fixture('fail', 'sys.exit(7)'), self.fixture('pass-one'), self.fixture('pass-two')]
        self.assertFalse(self.run_suite(fixtures))
        results = json.loads((self.root / 'evidence/fixture-results.json').read_text())
        self.assertEqual(len(results), 3)
        failed = next(result for result in results if result['outcome'] == 'FAIL')
        self.assertEqual(failed['exit_code'], 7)
        self.assertEqual(sum(result['outcome'] == 'PASS' for result in results), 2)

    def test_timeout_kills_descendants_and_continues_other_fixtures(self):
        leaked = self.root / 'leaked-child'
        child = f'import time; from pathlib import Path; time.sleep(0.8); Path({str(leaked)!r}).touch()'
        fixture = self.fixture('timeout', f'subprocess.Popen([sys.executable, "-c", {child!r}])\ntime.sleep(10)')
        self.assertFalse(self.run_suite([fixture, self.fixture('after-timeout')], timeout=0.2))
        result = json.loads((fixture.output / 'runner-result.json').read_text())
        self.assertEqual(result['exit_code'], 124)
        self.assertIn('Timed out', result['error'])
        time.sleep(0.9)
        self.assertFalse(leaked.exists(), 'A timed-out descendant escaped the two-slot bound')

    def test_missing_result_cannot_reuse_stale_success(self):
        fixture = self.fixture('missing', result=None)
        fixture.output.mkdir()
        (fixture.output / 'results.json').write_text('[{"passed": true}]')
        self.assertFalse(self.run_suite([fixture]))
        result = json.loads((fixture.output / 'runner-result.json').read_text())
        self.assertEqual(result['exit_code'], 0)
        self.assertIn('FileNotFoundError', result['error'])

    def test_malformed_empty_or_non_result_json_fails_closed(self):
        for index, value in enumerate(('invalid json', '[]', '{}', '[null]', '[{}]')):
            with self.subTest(value=value):
                self.assertFalse(self.run_suite([self.fixture(f'invalid-{index}', result=value)]))

    def test_missing_duplicate_or_unknown_completion_fails_closed(self):
        fixtures = [self.fixture('one'), self.fixture('two')]
        results = [{'fixture': str(fixture.script), 'outcome': 'PASS'} for fixture in fixtures]
        self.assertTrue(runner.suite_succeeded(fixtures, results))
        self.assertFalse(runner.suite_succeeded(fixtures, results[:1]))
        self.assertFalse(runner.suite_succeeded(fixtures, [results[0], results[0]]))
        self.assertFalse(runner.suite_succeeded(fixtures, [results[0], {'fixture': 'unknown', 'outcome': 'PASS'}]))
        self.assertFalse(runner.suite_succeeded([], []))

    def test_colliding_outputs_are_rejected_before_any_command(self):
        first, second = self.fixture('one'), self.fixture('two')
        with self.assertRaisesRegex(ValueError, 'directories must be unique'):
            self.run_suite([first, runner.Fixture(second.script, first.output)])
        with self.assertRaisesRegex(ValueError, 'Duplicate fixture scripts'):
            self.run_suite([first, first])
        self.assertFalse(self.events.exists())

    def test_missing_executable_fails_closed(self):
        fixture = self.fixture('missing-command')
        self.assertFalse(runner.run_suite([fixture], self.root / 'evidence', executable='/missing/command'))

    def test_unwritable_artifacts_fail_without_skipping_other_results(self):
        fixture = self.fixture('bad-output')
        fixture.output.touch()
        self.assertFalse(self.run_suite([fixture, self.fixture('good-output')]))
        results = json.loads((self.root / 'evidence/fixture-results.json').read_text())
        self.assertEqual(len(results), 2)
        self.assertEqual(sum(result['outcome'] == 'PASS' for result in results), 1)

    def test_network_guard_and_synthetic_environment_are_inherited(self):
        values = {
            'NODE_OPTIONS': '--require ./scripts/qa/local-network-only.cjs',
            'VITE_SUPABASE_URL': 'http://127.0.0.1:54321',
        }
        checks = '\n'.join(f'assert os.environ[{key!r}] == {value!r}' for key, value in values.items())
        fixture = self.fixture('environment', checks)
        with patch.dict(os.environ, values):
            self.assertTrue(self.run_suite([fixture]))


if __name__ == '__main__':
    unittest.main()
