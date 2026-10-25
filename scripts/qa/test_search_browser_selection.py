import tempfile
import unittest
from pathlib import Path
from search_browser_selection import select_search_browser


class SearchBrowserSelectionTests(unittest.TestCase):
    def test_bundle_wins_over_system_in_both_environments(self):
        with tempfile.TemporaryDirectory() as directory:
            bundled, system = Path(directory)/'bundle', Path(directory)/'system'
            bundled.touch(); system.touch()
            for ci in (False, True):
                selected = select_search_browser(bundled, ci=ci, system_path=system)
                self.assertEqual(selected, {'executable_path': str(bundled), 'source': 'playwright-bundled', 'ci': ci})

    def test_ci_missing_bundle_fails_even_when_system_exists(self):
        with tempfile.TemporaryDirectory() as directory:
            system = Path(directory)/'system'; system.touch()
            with self.assertRaisesRegex(FileNotFoundError, 'CI requires'):
                select_search_browser(Path(directory)/'missing', ci=True, system_path=system)

    def test_local_fallback_is_explicit_and_missing_both_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            system = Path(directory)/'system'; system.touch()
            selected = select_search_browser(Path(directory)/'missing', ci=False, system_path=system)
            self.assertEqual(selected['source'], 'local-system-fallback')
            system.unlink()
            with self.assertRaises(FileNotFoundError):
                select_search_browser(Path(directory)/'missing', ci=False, system_path=system)


if __name__ == '__main__':
    unittest.main()
