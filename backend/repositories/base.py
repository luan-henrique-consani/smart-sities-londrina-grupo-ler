"""Interface de acesso a dados.

As rotas e os serviços só conhecem esta interface. Hoje a implementação lê
os JSON de /data (somente leitura) e escreve em memória; depois, basta uma
implementação PostgreSQL com os mesmos métodos.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

Record = dict[str, Any]


class Repository(ABC):
    # ----- leitura (seed) -----
    @abstractmethod
    def meta(self) -> Record: ...

    @abstractmethod
    def load_status(self) -> dict[str, str]:
        """Por arquivo/tabela: "ok" ou "fallback" (seed embutido)."""

    @abstractmethod
    def areas(self) -> list[Record]: ...

    @abstractmethod
    def points(self) -> list[Record]: ...

    @abstractmethod
    def point(self, point_id: str) -> Record | None: ...

    @abstractmethod
    def episodes_for_point(self, point_id: str) -> list[Record]: ...

    @abstractmethod
    def cleanings_for_point(self, point_id: str) -> list[Record]: ...

    @abstractmethod
    def forecasts_as_of(self) -> str | None: ...

    @abstractmethod
    def point_forecast(self, point_id: str) -> Record | None: ...

    @abstractmethod
    def point_forecasts(self) -> list[Record]: ...

    @abstractmethod
    def flood_areas(self) -> list[Record]: ...

    @abstractmethod
    def flood_forecast(self, flood_area_id: str) -> Record | None: ...

    @abstractmethod
    def drains(self) -> list[Record]: ...

    @abstractmethod
    def flood_events(self) -> list[Record]: ...

    @abstractmethod
    def rain(self) -> Record: ...

    @abstractmethod
    def kpis(self) -> Record: ...

    @abstractmethod
    def yearly(self) -> list[Record]: ...

    @abstractmethod
    def next3months(self) -> Record: ...

    @abstractmethod
    def alerts(self) -> list[Record]: ...

    @abstractmethod
    def user_by_email(self, email: str) -> Record | None: ...

    @abstractmethod
    def user_by_id(self, user_id: str) -> Record | None: ...

    # ----- escrita (store em memória no MVP) -----
    @abstractmethod
    def add_decision(self, point_id: str, decision: Record) -> Record: ...

    @abstractmethod
    def decisions_for_point(self, point_id: str) -> list[Record]: ...

    @abstractmethod
    def add_client_log(self, entry: Record) -> None: ...

    @abstractmethod
    def client_logs(self) -> list[Record]: ...

    @abstractmethod
    def revoke_token(self, jti: str, expires_at: float) -> None: ...

    @abstractmethod
    def is_token_revoked(self, jti: str) -> bool: ...

    # ----- LGPD (store em memória no MVP) -----
    @abstractmethod
    def add_audit(self, entry: Record) -> None: ...

    @abstractmethod
    def audit_entries(self, user_id: str | None = None) -> list[Record]: ...

    @abstractmethod
    def set_consent(self, user_id: str, record: Record) -> None: ...

    @abstractmethod
    def consent_for(self, user_id: str) -> Record | None: ...

    @abstractmethod
    def decisions_by_user(self, user_id: str) -> list[Record]: ...

    @abstractmethod
    def add_deletion_request(self, request: Record) -> Record: ...

    @abstractmethod
    def deletion_requests(self, user_id: str | None = None) -> list[Record]: ...

    @abstractmethod
    def delete_user_data(self, user_id: str) -> dict[str, int]: ...
