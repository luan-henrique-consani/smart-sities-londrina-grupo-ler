"""Store em memória para as escritas do MVP.

Limitação conhecida: zera a cada cold start e não é compartilhado entre
instâncias da função serverless.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from typing import Any

Record = dict[str, Any]


class MemoryStore:
    def __init__(self, max_client_logs: int = 200, max_decisions_per_point: int = 200) -> None:
        self._lock = threading.Lock()
        self._decisions: dict[str, deque[Record]] = defaultdict(
            lambda: deque(maxlen=max_decisions_per_point)
        )
        self._decision_seq = 0
        self._client_logs: deque[Record] = deque(maxlen=max_client_logs)
        self._revoked: dict[str, float] = {}

    def add_decision(self, point_id: str, decision: Record) -> Record:
        with self._lock:
            self._decision_seq += 1
            record = {"id": f"DEC-{self._decision_seq:04d}", "point_id": point_id, **decision}
            self._decisions[point_id].append(record)
            return record

    def decisions_for_point(self, point_id: str) -> list[Record]:
        with self._lock:
            return list(reversed(self._decisions.get(point_id, ())))

    def add_client_log(self, entry: Record) -> None:
        with self._lock:
            self._client_logs.append(entry)

    def client_logs(self) -> list[Record]:
        with self._lock:
            return list(self._client_logs)

    def revoke_token(self, jti: str, expires_at: float) -> None:
        now = time.time()
        with self._lock:
            for key in [k for k, exp in self._revoked.items() if exp < now]:
                del self._revoked[key]
            self._revoked[jti] = expires_at

    def is_token_revoked(self, jti: str) -> bool:
        with self._lock:
            return jti in self._revoked
