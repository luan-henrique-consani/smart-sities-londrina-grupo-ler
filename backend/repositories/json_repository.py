"""Repositório sobre os JSON de /data (somente leitura) + store em memória."""

from __future__ import annotations

import copy
import json
from collections import defaultdict
from pathlib import Path
from typing import Any

from backend import __version__
from backend.core.logging import logger
from backend.repositories.base import Record, Repository
from backend.repositories.memory_store import MemoryStore

# Seed embutido mínimo: usado quando um arquivo está ausente ou corrompido.
# Mantém a API de pé (listas vazias, indicadores zerados) e sem usuários:
# sem users.json válido ninguém consegue entrar (falha fechada).
EMBEDDED_SEED: dict[str, Any] = {
    "meta": {
        "version": __version__,
        "generated_at": None,
        "reference_date": None,
        "system_start": None,
        "simulated": True,
        "notice": "Dados indisponíveis: usando o seed embutido mínimo.",
        "coordinates_notice": "Coordenadas aproximadas (referência: OpenStreetMap).",
        "calibration": [],
        "counts": {},
    },
    "areas": [],
    "points": [],
    "episodes": [],
    "cleanings": [],
    "flood_areas": [],
    "drains": [],
    "flood_events": [],
    "rain": {
        "unit": "mm/dia",
        "heavy_rain_mm": 30.0,
        "observed": [],
        "forecast": [],
        "horizons": {},
    },
    "forecasts": {"as_of": None, "points": [], "flood_areas": []},
    "kpis": {"as_of": None, "system_start": None, "periods": {}, "map": {}, "impact": {}},
    "yearly": [],
    "next3months": {"baseline": "", "plan_effects": {}, "months": [], "totals": {}},
    "alerts": [],
    "users": [],
}


class JsonRepository(Repository):
    def __init__(self, data_dir: Path, store: MemoryStore | None = None) -> None:
        self.data_dir = Path(data_dir)
        self.store = store or MemoryStore()
        self._status: dict[str, str] = {}
        self._data: dict[str, Any] = {name: self._load(name) for name in EMBEDDED_SEED}

        self._points_by_id = {p["id"]: p for p in self._data["points"] if "id" in p}
        self._episodes_by_point = self._group("episodes")
        self._cleanings_by_point = self._group("cleanings")
        forecasts = self._data["forecasts"]
        self._point_forecasts = {f["point_id"]: f for f in forecasts.get("points", [])}
        self._flood_forecasts = {
            f["flood_area_id"]: f for f in forecasts.get("flood_areas", [])
        }
        users = self._data["users"]
        self._users_by_email = {str(u["email"]).lower(): u for u in users if "email" in u}
        self._users_by_id = {u["id"]: u for u in users if "id" in u}
        logger.info(
            "seed carregado",
            extra={
                "files_ok": sum(1 for s in self._status.values() if s == "ok"),
                "files_fallback": sorted(k for k, s in self._status.items() if s != "ok"),
            },
        )

    def _load(self, name: str) -> Any:
        path = self.data_dir / f"{name}.json"
        expected = type(EMBEDDED_SEED[name])
        try:
            with path.open(encoding="utf-8") as handle:
                data = json.load(handle)
            if not isinstance(data, expected):
                raise ValueError(f"esperado {expected.__name__}, veio {type(data).__name__}")
        except (OSError, ValueError) as exc:  # JSONDecodeError é ValueError
            logger.critical(
                "arquivo de dados ausente ou corrompido; usando seed embutido",
                extra={"file": f"{name}.json", "reason": type(exc).__name__},
            )
            self._status[name] = "fallback"
            return copy.deepcopy(EMBEDDED_SEED[name])
        self._status[name] = "ok"
        return data

    def _group(self, name: str) -> dict[str, list[Record]]:
        grouped: dict[str, list[Record]] = defaultdict(list)
        for item in self._data[name]:
            point_id = item.get("point_id")
            if point_id:
                grouped[point_id].append(item)
        return grouped

    # ----- leitura -----
    def meta(self) -> Record:
        return self._data["meta"]

    def load_status(self) -> dict[str, str]:
        return dict(self._status)

    def areas(self) -> list[Record]:
        return self._data["areas"]

    def points(self) -> list[Record]:
        return self._data["points"]

    def point(self, point_id: str) -> Record | None:
        return self._points_by_id.get(point_id)

    def episodes_for_point(self, point_id: str) -> list[Record]:
        return self._episodes_by_point.get(point_id, [])

    def cleanings_for_point(self, point_id: str) -> list[Record]:
        return self._cleanings_by_point.get(point_id, [])

    def forecasts_as_of(self) -> str | None:
        return self._data["forecasts"].get("as_of")

    def point_forecast(self, point_id: str) -> Record | None:
        return self._point_forecasts.get(point_id)

    def point_forecasts(self) -> list[Record]:
        return self._data["forecasts"].get("points", [])

    def flood_areas(self) -> list[Record]:
        return self._data["flood_areas"]

    def flood_forecast(self, flood_area_id: str) -> Record | None:
        return self._flood_forecasts.get(flood_area_id)

    def drains(self) -> list[Record]:
        return self._data["drains"]

    def flood_events(self) -> list[Record]:
        return self._data["flood_events"]

    def rain(self) -> Record:
        return self._data["rain"]

    def kpis(self) -> Record:
        return self._data["kpis"]

    def yearly(self) -> list[Record]:
        return self._data["yearly"]

    def next3months(self) -> Record:
        return self._data["next3months"]

    def alerts(self) -> list[Record]:
        return self._data["alerts"]

    def user_by_email(self, email: str) -> Record | None:
        return self._users_by_email.get(email.strip().lower())

    def user_by_id(self, user_id: str) -> Record | None:
        return self._users_by_id.get(user_id)

    # ----- escrita (memória) -----
    def add_decision(self, point_id: str, decision: Record) -> Record:
        return self.store.add_decision(point_id, decision)

    def decisions_for_point(self, point_id: str) -> list[Record]:
        return self.store.decisions_for_point(point_id)

    def add_client_log(self, entry: Record) -> None:
        self.store.add_client_log(entry)

    def client_logs(self) -> list[Record]:
        return self.store.client_logs()

    def revoke_token(self, jti: str, expires_at: float) -> None:
        self.store.revoke_token(jti, expires_at)

    def is_token_revoked(self, jti: str) -> bool:
        return self.store.is_token_revoked(jti)
