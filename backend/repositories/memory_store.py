"""Store em memória para as escritas do MVP.

Limitação conhecida: zera a cada cold start e não é compartilhado entre
instâncias da função serverless.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from datetime import UTC, datetime, timedelta
from typing import Any

Record = dict[str, Any]


class MemoryStore:
    def __init__(
        self,
        max_client_logs: int = 200,
        max_decisions_per_point: int = 200,
        max_audit: int = 2000,
        audit_retention_days: int = 183,
    ) -> None:
        self._audit_retention = timedelta(days=audit_retention_days)
        self._lock = threading.Lock()
        self._decisions: dict[str, deque[Record]] = defaultdict(
            lambda: deque(maxlen=max_decisions_per_point)
        )
        self._decision_seq = 0
        self._client_logs: deque[Record] = deque(maxlen=max_client_logs)
        self._revoked: dict[str, float] = {}
        self._audit: deque[Record] = deque(maxlen=max_audit)
        self._consents: dict[str, Record] = {}
        self._deletions: list[Record] = []

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

    # ----- LGPD: auditoria, consentimento e exclusão -----
    def add_audit(self, entry: Record) -> None:
        with self._lock:
            self._purge_audit()
            self._audit.append(entry)

    def _purge_audit(self) -> None:
        """Retenção de 6 meses para a trilha de acesso (chamado com o lock já adquirido)."""
        cutoff = (datetime.now(UTC) - self._audit_retention).isoformat(timespec="seconds")
        while self._audit and str(self._audit[0].get("time", "")) < cutoff:
            self._audit.popleft()

    def audit_entries(self, user_id: str | None = None) -> list[Record]:
        with self._lock:
            self._purge_audit()
            return [e for e in self._audit if user_id is None or e.get("user_id") == user_id]

    def set_consent(self, user_id: str, record: Record) -> None:
        with self._lock:
            self._consents[user_id] = record

    def consent_for(self, user_id: str) -> Record | None:
        with self._lock:
            return self._consents.get(user_id)

    def decisions_by_user(self, user_id: str) -> list[Record]:
        with self._lock:
            return [
                d
                for items in self._decisions.values()
                for d in items
                if d.get("created_by_id") == user_id
            ]

    def add_deletion_request(self, request: Record) -> Record:
        with self._lock:
            record = {"id": f"DEL-{len(self._deletions) + 1:04d}", **request}
            self._deletions.append(record)
            return record

    def deletion_requests(self, user_id: str | None = None) -> list[Record]:
        with self._lock:
            return [r for r in self._deletions if user_id is None or r.get("user_id") == user_id]

    def delete_user_data(self, user_id: str) -> dict[str, int]:
        """Remove do store o que se liga ao usuário (a trilha de auditoria fica: ver LGPD.md)."""
        with self._lock:
            removed_decisions = 0
            for point_id, items in self._decisions.items():
                kept = [d for d in items if d.get("created_by_id") != user_id]
                removed_decisions += len(items) - len(kept)
                self._decisions[point_id] = deque(kept, maxlen=items.maxlen)
            removed_consent = 1 if self._consents.pop(user_id, None) else 0
            return {"decisions": removed_decisions, "consents": removed_consent}
