"""
Root-level conftest.py — loaded by pytest before any test module is collected.

Since backend/db/client.py calls create_client() and get_supabase_admin_client()
at module-import time, we must patch the supabase library BEFORE the backend
package is imported. Using pytest's plugin system (conftest at the root) with
sys.modules patching achieves this safely.
"""
import sys
from unittest.mock import MagicMock, patch

# ── 1. Build a complete MagicMock that looks like a live Supabase Client ──────
_mock_client = MagicMock()

# Make table(...).select(...).eq(...).execute() etc. all return chainable mocks
# that have an empty .data list by default (safe for unit tests).
_table_mock = MagicMock()
_table_mock.select.return_value = _table_mock
_table_mock.insert.return_value = _table_mock
_table_mock.update.return_value = _table_mock
_table_mock.delete.return_value = _table_mock
_table_mock.upsert.return_value = _table_mock
_table_mock.eq.return_value = _table_mock
_table_mock.neq.return_value = _table_mock
_table_mock.gt.return_value = _table_mock
_table_mock.gte.return_value = _table_mock
_table_mock.lt.return_value = _table_mock
_table_mock.lte.return_value = _table_mock
_table_mock.in_.return_value = _table_mock
_table_mock.is_.return_value = _table_mock
_table_mock.order.return_value = _table_mock
_table_mock.limit.return_value = _table_mock

_exec_result = MagicMock()
_exec_result.data = []
_exec_result.count = 0
_table_mock.execute.return_value = _exec_result

_mock_client.table.return_value = _table_mock

# ── 2. Patch create_client to return our mock client ──────────────────────────
_patcher = patch("supabase.create_client", return_value=_mock_client)
_patcher.start()

# Also patch the underlying Client constructor used by some supabase versions
try:
    _patcher2 = patch("supabase._sync.client.SyncClient.__init__", return_value=None)
    _patcher2.start()
except Exception:
    pass
