"""Use a throwaway SQLite file so API tests do not touch library.db."""

import os
import sys
import tempfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

TEST_DB = Path(tempfile.gettempdir()) / "pbsd_lms_pytest.db"
if TEST_DB.exists():
    TEST_DB.unlink()
os.environ["LMS_DB_PATH"] = str(TEST_DB)

