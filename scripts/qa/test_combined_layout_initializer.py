"""Pure evaluator semantics regression. No Playwright/browser or network calls."""
import ast
import json
from pathlib import Path
import shutil
import subprocess
import unittest

SOURCE = Path(__file__).with_name('combined-layout-ui.py')
URL = 'https://wa.me/66922407355?text=Hi%2C+I%27m+interested+in+myUNO+for+my+management+company'
EVALUATE = r"""const vm=require('node:vm'),fs=require('node:fs');
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const context={window:{}};
let result=vm.runInNewContext(input.source,context);
// Model page.evaluate: a function result is invoked with its optional argument.
if(typeof result==='function')result=result(null);
const before=context.window.fixtureOpened.slice();
context.window.open(input.url,'_blank');
process.stdout.write(JSON.stringify({before,after:context.window.fixtureOpened,returnedUndefined:result===undefined}));
"""


class CaptureInitializerContract(unittest.TestCase):
    def evaluate(self, expression):
        node = shutil.which('node')
        self.assertIsNotNone(node, 'Node is required for fixture evaluator contract')
        result = subprocess.run([node, '-e', EVALUATE], input=json.dumps({'source': expression, 'url': URL}),
                                text=True, capture_output=True, check=True)
        return json.loads(result.stdout)

    def test_actual_initializer_records_only_the_explicit_open(self):
        tree = ast.parse(SOURCE.read_text(encoding='utf-8'))
        initializers = [node.args[0].value for node in ast.walk(tree)
                        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
                        and node.func.attr == 'evaluate' and node.args
                        and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str)
                        and 'window.fixtureOpened' in node.args[0].value and 'window.open =' in node.args[0].value]
        self.assertEqual(len(initializers), 1)
        result = self.evaluate(initializers[0])
        self.assertEqual(result['before'], [])
        self.assertEqual(result['after'], [[URL, '_blank']])
        self.assertTrue(result['returnedUndefined'])

    def test_previous_assignment_expression_reproduces_spurious_call(self):
        result = self.evaluate('window.fixtureOpened=[];window.open=(...args)=>window.fixtureOpened.push(args)')
        self.assertEqual(result['before'], [[None]])
        self.assertEqual(result['after'], [[None], [URL, '_blank']])


if __name__ == '__main__':
    unittest.main()
