import sys,runpy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'prevora_revision'))
import win_library
helper=Path(__file__).resolve().parent/'helpers'/'library_download.py'
sys.path.insert(0,str(helper.parent))
sys.argv=[str(helper)]
runpy.run_path(str(helper),run_name='__main__')
