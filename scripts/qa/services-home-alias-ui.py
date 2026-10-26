"""Production-shaped Home identity matrix using the existing isolated components."""
import os
from pathlib import Path
import runpy

os.environ['SERVICES_DISCOVERY_SCOPE'] = 'home-aliases'
runpy.run_path(str(Path(__file__).with_name('services-discovery-ui.py')), run_name='__main__')
