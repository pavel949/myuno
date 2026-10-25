"""Pure scheduler/completeness tests. No browser or network is started."""
import asyncio
import importlib.util
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

SOURCE=Path(__file__).with_name('combined-layout-ui.py')
spec=importlib.util.spec_from_file_location('combined_layout_matrix_under_test',SOURCE)
layout=importlib.util.module_from_spec(spec)
with patch.object(sys,'argv',[str(SOURCE),'/tmp/combined-layout-pure-contract']):
    spec.loader.exec_module(layout)

class CombinedLayoutMatrixContract(unittest.TestCase):
    def rows(self):
        return [{'lang':lang,'width':width,'surface':surface,'outcome':'PASS'} for lang in layout.LANGUAGES for width in layout.WIDTHS for surface in layout.SURFACES]

    def test_original_105_cases_are_required_without_dimension_reduction(self):
        self.assertEqual(layout.LANGUAGES,['ru','en','th'])
        self.assertEqual(layout.WIDTHS,[320,360,640,767,1280])
        self.assertEqual(layout.SURFACES,['property','account','local-services','developers','management-companies','owners','business'])
        result=layout.validate_layout_matrix(self.rows())
        self.assertEqual(result,{'cases':105,'outcome':'PASS','maxActiveContexts':2})

    def test_missing_duplicate_wrong_identity_and_failed_cases_are_rejected(self):
        for mutation in ['missing','duplicate','unknown','failed','extra']:
            with self.subTest(mutation=mutation):
                rows=self.rows()
                if mutation=='missing':rows.pop()
                if mutation=='duplicate':rows[-1]=dict(rows[0])
                if mutation=='unknown':rows[-1]['lang']='unknown'
                if mutation=='failed':rows[-1]['outcome']='FAIL'
                if mutation=='extra':rows.append(dict(rows[0]))
                with self.assertRaises(AssertionError):layout.validate_layout_matrix(rows)

    def test_every_language_runs_once_with_at_most_two_active_lanes(self):
        async def exercise():
            active=0;peak=0;called=[]
            async def lane(lang):
                nonlocal active,peak
                active+=1;peak=max(peak,active);called.append(lang)
                try:await asyncio.sleep(.005)
                finally:active-=1
            await layout.run_layout_lanes(lane)
            return active,peak,called
        active,peak,called=asyncio.run(exercise())
        self.assertEqual(active,0);self.assertEqual(peak,2)
        self.assertCountEqual(called,['ru','en','th'])

if __name__=='__main__':unittest.main()
