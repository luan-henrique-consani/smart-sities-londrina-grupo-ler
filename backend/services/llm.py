"""Serviço de texto (LLM).

Os NÚMEROS vêm dos modelos estatísticos (dicionário `facts`); o LLM só
escreve. Usa a API do Claude apenas se existir ANTHROPIC_API_KEY; em
qualquer erro, timeout (15 s) ou recusa, cai para os modelos de texto prontos.
Nunca recebe dados pessoais: `facts` só tem números e nomes de lugares.
"""

from __future__ import annotations

import json
import random
import threading
from dataclasses import dataclass
from typing import Any

from backend.core import config
from backend.core.logging import logger
from backend.services import text_templates

Facts = dict[str, Any]

SYSTEM_PROMPT = (
    "Você escreve textos em português do Brasil para a Prefeitura de Londrina (PR), no sistema "
    "Prevora, que ajuda servidores públicos a prevenir descarte irregular de lixo e "
    "alagamentos. Os textos são lidos por servidores e por moradores, então use linguagem "
    "simples, frases curtas e tom respeitoso.\n\n"
    "Todos os números vêm de modelos estatísticos e chegam no bloco DADOS. Use somente esses "
    "números, sem arredondar de outro jeito e sem inventar fatos, datas, endereços, telefones "
    "ou nomes de pessoas. Quando faltar uma informação local, mantenha um marcador entre "
    "colchetes, como [PONTO DE ENTREGA MAIS PRÓXIMO], [TELEFONE DA CMTU] ou "
    "[LOGO DA PREFEITURA]; não use logos oficiais.\n\n"
    "Formato da resposta: texto puro, sem Markdown. A primeira linha é o título; depois uma "
    "linha em branco; depois o texto."
)

MATERIAL_TASKS = {
    "poster": (
        "Escreva o texto de um cartaz A4 para ser fixado perto do ponto de descarte: um título "
        "forte, duas ou três frases com os números do ponto, uma lista curta do que fazer e "
        "uma frase final. Comece o corpo com [LOGO DA PREFEITURA]."
    ),
    "social": (
        "Escreva um post para as redes sociais da Prefeitura (até 600 caracteres), com os "
        "números do ponto, o que o morador pode fazer e de duas a três hashtags."
    ),
    "door_to_door": (
        "Escreva um roteiro de abordagem porta a porta de 2 a 3 minutos para a equipe de campo: "
        "apresentação, o problema com números, por que importa, o que pedimos, escuta e "
        "encerramento. Lembre a equipe de anotar só o problema, nunca nome, telefone ou endereço."
    ),
    "action_plan": (
        "Escreva um plano de ação de 30 dias para o ponto, semana a semana, combinando limpeza, "
        "placa, ação porta a porta, fiscalização no horário provável e recuperação do espaço, "
        "com um diagnóstico inicial e a forma de medir o resultado."
    ),
}
AUDIENCE_LABELS = {
    "moradores": "moradores do entorno",
    "comerciantes": "comerciantes do entorno",
    "escolas": "comunidade escolar",
    "geral": "população em geral",
}
TONE_LABELS = {
    "amigavel": "amigável e acolhedor",
    "informativo": "informativo e neutro",
    "direto": "direto e firme, sem ser agressivo",
}
EXPLAIN_TASKS = {
    "map": "a tela do mapa, com os alertas de alagamento e de resíduos",
    "forecasts": "a tela de previsões e resultados, com o comparativo sem ação × com o plano",
    "point": "a tela de um ponto de descarte irregular",
    "flood_area": "o risco de uma área de alagamento",
}


@dataclass(frozen=True)
class TextResult:
    title: str
    text: str
    mode: str  # "api" | "fallback"
    model: str | None = None


def llm_mode() -> str:
    return "api" if config.anthropic_api_key() else "fallback"


def _call_claude(task: str, facts: Facts, max_tokens: int) -> TextResult | None:
    """Chama o Claude. Retorna None (→ fallback) em qualquer falha."""
    api_key = config.anthropic_api_key()
    if not api_key:
        return None
    model = config.anthropic_model()
    try:
        import anthropic  # import tardio: não pesa no cold start em modo fallback
    except ImportError:
        logger.error("SDK anthropic indisponível; usando fallback de texto")
        return None

    user_content = f"{task}\n\nDADOS (JSON):\n{json.dumps(facts, ensure_ascii=False, indent=2)}"
    try:
        client = anthropic.Anthropic(
            api_key=api_key, timeout=config.LLM_TIMEOUT_SECONDS, max_retries=0
        )
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=SYSTEM_PROMPT,
            output_config={"effort": "low"},
            messages=[{"role": "user", "content": user_content}],
        )
    except anthropic.APITimeoutError:
        logger.warning("LLM excedeu o tempo limite; usando fallback de texto")
        return None
    except anthropic.RateLimitError:
        logger.warning("LLM com limite de uso atingido; usando fallback de texto")
        return None
    except anthropic.APIStatusError as exc:
        logger.error(
            "LLM retornou erro; usando fallback de texto", extra={"status": exc.status_code}
        )
        return None
    except anthropic.APIConnectionError:
        logger.warning("LLM inacessível; usando fallback de texto")
        return None
    except Exception as exc:  # noqa: BLE001 — a demo nunca pode quebrar por causa do LLM
        logger.error(
            "falha inesperada no LLM; usando fallback de texto",
            extra={"reason": type(exc).__name__},
        )
        return None

    if response.stop_reason in ("refusal", "max_tokens"):
        logger.warning(
            "LLM não concluiu o texto; usando fallback", extra={"stop_reason": response.stop_reason}
        )
        return None
    raw = "".join(block.text for block in response.content if block.type == "text").strip()
    if not raw:
        return None
    title, _, body = raw.partition("\n")
    title, body = title.strip().strip("#* "), body.strip()
    if not body:
        title, body = "Texto gerado", raw
    return TextResult(title=title[:200], text=body, mode="api", model=model)


def generate_awareness(
    material: str, audience: str, tone: str, facts: Facts, variant: int | None = None
) -> tuple[TextResult, int]:
    """Material de conscientização para um ponto. Retorna (texto, variante usada)."""
    chosen = variant if variant is not None else random.randrange(text_templates.VARIANTS)
    task = (
        f"{MATERIAL_TASKS[material]}\n\nPúblico: {AUDIENCE_LABELS[audience]}. "
        f"Tom: {TONE_LABELS[tone]}. Esta é a versão {chosen + 1}: se já existir outra versão, "
        "varie a abordagem."
    )
    result = _call_claude(task, facts, max_tokens=4000)
    if result is None:
        title, text = text_templates.AWARENESS[material](facts, audience, tone, chosen)
        result = TextResult(title=title, text=text, mode="fallback")
    return result, chosen


_explain_cache: dict[str, TextResult] = {}
_explain_lock = threading.Lock()


def explain(context: str, facts: Facts, cache_key: str) -> TextResult:
    """Explicação dos números de uma tela (as respostas da API ficam em cache no processo)."""
    with _explain_lock:
        cached = _explain_cache.get(cache_key)
    if cached is not None and llm_mode() == "api":
        return cached
    task = (
        f"Explique em um parágrafo (de 4 a 6 frases) os números de {EXPLAIN_TASKS[context]}: o "
        "que eles dizem, por que importam e qual ação tomar primeiro. Deixe claro o ganho para o "
        "servidor e para o cidadão."
    )
    result = _call_claude(task, facts, max_tokens=2000)
    if result is None:
        title, text = text_templates.explain(context, facts)
        return TextResult(title=title, text=text, mode="fallback")
    with _explain_lock:
        if len(_explain_cache) > 500:
            _explain_cache.clear()
        _explain_cache[cache_key] = result
    return result
