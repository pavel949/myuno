"""Pure VM tests of the actual polling predicate; no browser or network."""
import json
import shutil
import subprocess
import unittest
from dialog_readiness import DIALOG_SETTLED


class DialogReadinessContract(unittest.TestCase):
    def evaluate(self, frames):
        script = """const vm=require('node:vm'),fs=require('node:fs');
const input=JSON.parse(fs.readFileSync(0,'utf8'));
let frame;
const context={window:{},performance:{now:()=>frame.time},WeakMap};
const ready=vm.runInNewContext('('+input.predicate+')',context);
const element={isConnected:true,getBoundingClientRect:()=>({x:frame.x,y:0,width:384,height:900}),
getAnimations:()=>frame.animations||[]};
process.stdout.write(JSON.stringify(input.frames.map(f=>{frame=f;return ready(element)})));
"""
        result = subprocess.run([shutil.which('node'), '-e', script],
            input=json.dumps({'predicate': DIALOG_SETTLED, 'frames': frames}),
            text=True, capture_output=True, check=True)
        return json.loads(result.stdout)

    def test_running_entry_cannot_pass_even_when_its_position_is_temporarily_static(self):
        self.assertEqual(self.evaluate([
            {'time': 0, 'x': 639, 'animations': [{'playState': 'running'}]},
            {'time': 200, 'x': 639, 'animations': [{'playState': 'running'}]},
            {'time': 500, 'x': 255}, {'time': 599, 'x': 255}, {'time': 600, 'x': 255},
        ]), [False, False, False, False, True])

    def test_position_changes_restart_the_observation_window(self):
        self.assertEqual(self.evaluate([
            {'time': 0, 'x': 639}, {'time': 100, 'x': 400},
            {'time': 200, 'x': 255}, {'time': 299, 'x': 255}, {'time': 300, 'x': 255},
        ]), [False, False, False, False, True])

    def test_pending_animation_blocks_readiness(self):
        self.assertEqual(self.evaluate([
            {'time': 0, 'x': 255},
            {'time': 100, 'x': 255, 'animations': [{'playState': 'paused', 'pending': True}]},
            {'time': 199, 'x': 255}, {'time': 200, 'x': 255},
        ]), [False, False, False, True])


if __name__ == '__main__':
    unittest.main()
