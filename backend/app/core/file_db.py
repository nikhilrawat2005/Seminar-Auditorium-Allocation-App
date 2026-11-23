import os
import csv
import threading
import json
from typing import List, Dict, Any, Optional

class FileDB:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        os.makedirs(self.data_dir, exist_ok=True)
        self._lock = threading.RLock()

    def _get_path(self, table: str) -> str:
        return os.path.join(self.data_dir, f"{table}.csv")

    def _deserialize_val(self, val: str) -> Any:
        if val == "" or val is None:
            return None
        # Check if json array or object
        trimmed = val.strip()
        if (trimmed.startswith("{") and trimmed.endswith("}")) or (trimmed.startswith("[") and trimmed.endswith("]")):
            try:
                return json.loads(trimmed)
            except Exception:
                pass
        # Check integer
        if val.isdigit() or (val.startswith("-") and val[1:].isdigit()):
            try:
                return int(val)
            except Exception:
                pass
        # Check float
        try:
            f = float(val)
            # Avoid casting normal strings that match float incorrectly if any
            if "." in val:
                return f
        except Exception:
            pass
        # Check boolean
        if val.lower() == "true":
            return True
        elif val.lower() == "false":
            return False
        return val

    def _serialize_val(self, val: Any) -> str:
        if val is None:
            return ""
        if isinstance(val, (dict, list)):
            return json.dumps(val, ensure_ascii=False)
        return str(val)

    def _read_table(self, table: str) -> List[Dict[str, Any]]:
        path = self._get_path(table)
        if not os.path.exists(path):
            return []
        try:
            rows: List[Dict[str, Any]] = []
            with open(path, "r", encoding="utf-8-sig", newline="") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    parsed_row = {k: self._deserialize_val(v) for k, v in r.items() if k is not None}
                    rows.append(parsed_row)
            return rows
        except Exception:
            return []

    def _write_table(self, table: str, rows: List[Dict[str, Any]]) -> None:
        path = self._get_path(table)
        temp_path = f"{path}.tmp"
        if not rows:
            # If empty, write empty file or keep headers if possible
            with open(temp_path, "w", encoding="utf-8", newline="") as f:
                pass
            os.replace(temp_path, path)
            return

        # Collect union of all fieldnames across rows preserving order
        fieldnames = []
        for r in rows:
            for k in r.keys():
                if k not in fieldnames:
                    fieldnames.append(k)

        with open(temp_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            for r in rows:
                serialized_row = {k: self._serialize_val(r.get(k)) for k in fieldnames}
                writer.writerow(serialized_row)
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
