import os
import json
import threading
from typing import List, Dict, Any, Optional

class FileDB:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        os.makedirs(self.data_dir, exist_ok=True)
        self._lock = threading.RLock()

    def _get_path(self, table: str) -> str:
        return os.path.join(self.data_dir, f"{table}.json")

    def _read_table(self, table: str) -> List[Dict[str, Any]]:
        path = self._get_path(table)
        if not os.path.exists(path):
            return []
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception:
            return []

    def _write_table(self, table: str, rows: List[Dict[str, Any]]) -> None:
        path = self._get_path(table)
        temp_path = f"{path}.tmp"
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(rows, f, indent=2, ensure_ascii=False)
        os.replace(temp_path, path)

    def select(self, table: str, predicate: Optional[Any] = None) -> List[Dict[str, Any]]:
        with self._lock:
            rows = self._read_table(table)
            if predicate is None:
                return rows
            return [r for r in rows if predicate(r)]

    def select_one(self, table: str, predicate: Any) -> Optional[Dict[str, Any]]:
        with self._lock:
            rows = self._read_table(table)
            for r in rows:
                if predicate(r):
                    return r
            return None

    def insert(self, table: str, row: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            rows = self._read_table(table)
            rows.append(row)
            self._write_table(table, rows)
            return row

    def update(self, table: str, predicate: Any, update_fields: Dict[str, Any]) -> List[Dict[str, Any]]:
        with self._lock:
            rows = self._read_table(table)
            updated = []
            for r in rows:
                if predicate(r):
                    r.update(update_fields)
                    updated.append(r)
            if updated:
                self._write_table(table, rows)
            return updated

    def delete(self, table: str, predicate: Any) -> int:
        with self._lock:
            rows = self._read_table(table)
            initial_count = len(rows)
            remaining = [r for r in rows if not predicate(r)]
            deleted_count = initial_count - len(remaining)
            if deleted_count > 0:
                self._write_table(table, remaining)
            return deleted_count

from app.core.config import settings
db = FileDB(settings.DATA_DIR)
