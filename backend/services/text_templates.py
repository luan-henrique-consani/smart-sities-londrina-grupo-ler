"""Modo FALLBACK: textos prontos em pt-BR preenchidos com os números reais.

Usados quando não há ANTHROPIC_API_KEY ou quando o LLM falha. Não usam
logos oficiais: só placeholders como [LOGO DA PREFEITURA].
"""

from __future__ import annotations

from typing import Any

Facts = dict[str, Any]

PLACE = "[PONTO DE ENTREGA MAIS PRÓXIMO]"
LOGO = "[LOGO DA PREFEITURA]"
PHONE = "[TELEFONE DA CMTU]"
VARIANTS = 3


def num(value: Any) -> str:
    """Número em formato brasileiro (vírgula decimal, ponto de milhar)."""
    if value is None:
        return "—"
    if isinstance(value, bool):
        return "sim" if value else "não"
    if isinstance(value, float) and not value.is_integer():
        return f"{value:.1f}".replace(".", ",")
    return f"{int(value):,}".replace(",", ".")


AUDIENCE_CALL = {
    "moradores": "Vizinho, vizinha",
    "comerciantes": "Comerciante",
    "escolas": "Comunidade escolar",
    "geral": "Londrinense",
}
AUDIENCE_HINT = {
    "moradores": "Móveis, entulho e restos de poda têm lugar certo: " + PLACE + ".",
    "comerciantes": (
        "Caixas, embalagens e sobras de reforma do comércio têm destino certo: " + PLACE + "."
    ),
    "escolas": (
        "Converse em sala e em casa: cada resíduo tem um destino certo, como o " + PLACE + "."
    ),
    "geral": "Entulho, móveis e restos de poda têm destino certo: " + PLACE + ".",
}
TONE_OPENING = {
    "amigavel": "Este cantinho é de todos nós. Vamos cuidar juntos?",
    "informativo": "Informação que ajuda o bairro inteiro.",
    "direto": "Aqui não é lugar de lixo.",
}
TONE_CLOSING = {
    "amigavel": "Obrigado por cuidar do nosso bairro!",
    "informativo": "Dúvidas sobre descarte: " + PHONE + ".",
    "direto": "Descarte irregular é infração e pode gerar multa.",
}


def _where(f: Facts) -> str:
    return f"{f['bairro']} (ponto {f['ponto']})"


def _return_sentence(f: Facts) -> str:
    if f.get("intervalo_medio_dias"):
        return (
            f"Depois de cada limpeza, o lixo volta em média a cada "
            f"{num(f['intervalo_medio_dias'])} dias."
        )
    return "O lixo tem voltado pouco tempo depois de cada limpeza."


def _flood_sentence(f: Facts) -> str:
    if f.get("area_de_alagamento_proxima"):
        return (
            f" Lixo na rua entope bocas de lobo: este ponto fica perto de "
            f"{f['area_de_alagamento_proxima']}, área com risco de alagamento."
        )
    return " Lixo na rua entope bocas de lobo e aumenta o risco de alagamento."


def poster(f: Facts, audience: str, tone: str, variant: int) -> tuple[str, str]:
    headlines = [
        "Rua limpa dura mais quando todo mundo ajuda",
        "Lixo aqui volta para a sua porta na próxima chuva",
        "Este espaço é do bairro. Não é depósito de lixo",
    ]
    title = headlines[variant % VARIANTS]
    body = [
        LOGO,
        "",
        title.upper(),
        "",
        TONE_OPENING[tone],
        "",
        f"{AUDIENCE_CALL[audience]}: nos últimos 15 dias, este ponto em {f['bairro']} "
        f"acumulou {f['tipo_de_residuo']} {num(f['episodios_em_15_dias'])} vez(es). "
        + _return_sentence(f)
        + _flood_sentence(f),
        "",
        "O QUE FAZER",
        f"• {AUDIENCE_HINT[audience]}",
        "• Coleta de móveis e volumosos: agende em " + PHONE + ".",
        "• Viu descarte irregular? Avise a Prefeitura pelo aplicativo Londrina ON.",
        "",
        TONE_CLOSING[tone],
        "",
        "Prevora · Prefeitura de Londrina",
    ]
    return title, "\n".join(body)


def social(f: Facts, audience: str, tone: str, variant: int) -> tuple[str, str]:
    openings = [
        f"📍 {f['bairro']}: {num(f['episodios_em_15_dias'])} acúmulos de lixo no mesmo ponto "
        "em 15 dias.",
        f"♻️ Você sabia? Em um ponto de {f['bairro']}, o lixo volta em média a cada "
        f"{num(f.get('intervalo_medio_dias'))} dias depois da limpeza.",
        f"🌧️ Lixo na rua + chuva forte = alagamento. Em {f['bairro']}, um mesmo ponto recebeu "
        f"descarte irregular {num(f['episodios_em_15_dias'])} vezes em 15 dias.",
    ]
    text = "\n\n".join(
        [
            openings[variant % VARIANTS],
            "A equipe limpa, mas limpeza sozinha não resolve: precisamos de você. "
            + TONE_OPENING[tone],
            f"✅ {AUDIENCE_HINT[audience]}\n✅ Móveis e volumosos: agende a coleta em {PHONE}.\n"
            "✅ Viu descarte irregular? Avise pelo Londrina ON.",
            TONE_CLOSING[tone],
            "#Prevora #CidadeLimpa #Londrina",
        ]
    )
    return f"Post para redes — {f['bairro']}", text


def door_to_door(f: Facts, audience: str, tone: str, variant: int) -> tuple[str, str]:
    greetings = [
        "Bom dia! Somos da equipe de limpeza urbana da Prefeitura. Tem dois minutinhos?",
        "Olá! Estamos conversando com quem mora e trabalha perto daqui sobre a limpeza da rua.",
        "Oi, tudo bem? A Prefeitura está visitando o entorno para cuidar melhor deste trecho.",
    ]
    hour = (
        f"O descarte costuma acontecer entre {f['horario_provavel']}."
        if f.get("horario_provavel")
        else "Ainda não identificamos um horário mais comum para o descarte."
    )
    steps = [
        f"ROTEIRO PORTA A PORTA — {_where(f)}",
        f"Público: {audience} · Duração: 2 a 3 minutos por visita",
        "",
        "1. APRESENTAÇÃO",
        f"\"{greetings[variant % VARIANTS]}\"",
        "",
        "2. O PROBLEMA, COM NÚMEROS",
        f"\"O ponto aqui perto acumulou {f['tipo_de_residuo']} {num(f['episodios_em_15_dias'])} "
        f"vez(es) nos últimos 15 dias. {_return_sentence(f)} Só neste mês foram "
        f"{num(f['horas_de_equipe_30_dias'])} horas de equipe neste local.\"",
        "",
        "3. POR QUE IMPORTA",
        f"\"{_flood_sentence(f).strip()} E a equipe que volta aqui deixa de atender outra rua.\"",
        "",
        "4. O QUE PEDIMOS",
        f"\"{AUDIENCE_HINT[audience]} Para móveis e volumosos, a coleta é agendada em {PHONE}.\"",
        "",
        "5. ESCUTA",
        "\"O senhor / a senhora sabe por que as pessoas descartam aqui? O que ajudaria?\"",
        "(Anote só o problema e a sugestão. NÃO anote nome, telefone nem endereço.)",
        "",
        "6. ENCERRAMENTO",
        f"\"{TONE_CLOSING[tone]}\" Entregue o folheto e siga para a próxima casa.",
        "",
        f"OBSERVAÇÃO PARA A EQUIPE: {hour}",
    ]
    return f"Roteiro porta a porta — {f['bairro']}", "\n".join(steps)


def action_plan(f: Facts, audience: str, tone: str, variant: int) -> tuple[str, str]:
    patrol = (
        f"Fiscalização no horário provável ({f['horario_provavel']})"
        if f.get("horario_provavel")
        else "Fiscalização em horários alternados para identificar o padrão"
    )
    recover = [
        "plantio de mudas e pintura do muro",
        "reforço da iluminação e instalação de floreiras",
        "mutirão de pintura com a comunidade",
    ][variant % VARIANTS]
    lines = [
        f"PLANO DE AÇÃO DE 30 DIAS — {_where(f)}",
        "",
        "DIAGNÓSTICO",
        f"• {num(f['episodios_em_15_dias'])} episódios em 15 dias "
        f"({num(f['episodios_no_historico'])} no histórico); resíduo principal: "
        f"{f['tipo_de_residuo']}.",
        f"• Intervalo médio de retorno: {num(f.get('intervalo_medio_dias'))} dias "
        f"(média da cidade: {num(f.get('intervalo_medio_cidade_dias'))} dias).",
        f"• Próximo acúmulo previsto: {f.get('proximo_acumulo') or 'sem previsão'}.",
        f"• Custo atual: {num(f['horas_de_equipe_30_dias'])} horas de equipe em "
        f"{num(f['limpezas_30_dias'])} atendimento(s) nos últimos 30 dias.",
        "",
        "SEMANA 1 — Limpar e sinalizar",
        "• Limpeza completa do ponto.",
        f"• Instalar placa com o {PLACE} e o telefone {PHONE}.",
        "",
        "SEMANA 2 — Conversar",
        f"• Ação porta a porta com {audience} do entorno (roteiro de conscientização).",
        "• Distribuir o cartaz em comércios, escolas e pontos de ônibus próximos.",
        "",
        "SEMANA 3 — Fiscalizar",
        f"• {patrol}.",
        "• Vistoria das bocas de lobo do entorno antes de chuva forte.",
        "",
        "SEMANA 4 — Recuperar o espaço",
        f"• Recuperação do espaço: {recover}.",
        "• Avaliar resultado e registrar a decisão no sistema.",
        "",
        "COMO MEDIR",
        "• Meta: nenhum novo episódio em 15 dias (sair da reincidência crônica).",
        "• Acompanhar: dias que o ponto fica limpo e horas de equipe no mês.",
        "",
        f"Responsável: [A DEFINIR] · {TONE_CLOSING[tone]}",
    ]
    return f"Plano de ação de 30 dias — {f['bairro']}", "\n".join(lines)


AWARENESS = {
    "poster": poster,
    "social": social,
    "door_to_door": door_to_door,
    "action_plan": action_plan,
}


def explain(context: str, f: Facts) -> tuple[str, str]:
    """Explicação dos números de uma tela, em linguagem simples."""
    if context == "map":
        top = (
            f" A mais crítica é {f['area_mais_critica']} (risco "
            f"{num(f['risco_da_area_mais_critica'])}/100), com chuva prevista de "
            f"{num(f['chuva_prevista_24h_mm'])} mm em 24 h."
            if f.get("area_mais_critica")
            else ""
        )
        return "Resumo do mapa", (
            f"Nas próximas 72 horas, {num(f['areas_risco_alto_72h'])} área(s) estão com risco "
            f"alto de alagamento.{top} Em resíduos, {num(f['pontos_com_entulho_previsto_7_dias'])} "
            f"ponto(s) devem acumular entulho nos próximos 7 dias e "
            f"{num(f['reincidentes_cronicos'])} são reincidentes crônicos: neles, limpeza sozinha "
            f"não resolve. {num(f['bocas_de_lobo_limpas_antes_da_chuva_pct'])}% das bocas de lobo "
            "foram limpas antes das últimas chuvas fortes. Prioridade sugerida: limpar bocas de "
            "lobo e pontos de lixo nas áreas de risco alto antes da chuva."
        )
    if context == "forecasts":
        return "Resumo das previsões e resultados", (
            f"Com o plano sugerido, os retornos de lixo nos próximos 3 meses caem de "
            f"{num(f['retornos_sem_acao'])} para {num(f['retornos_com_plano'])} "
            f"({num(f['reincidencia_proximos_3_meses_pct'])}%), e os alagamentos esperados, de "
            f"{num(f['alagamentos_sem_acao'])} para {num(f['alagamentos_com_plano'])}. Desde o "
            f"início das previsões, os pontos ficam limpos por {num(f['dias_limpo_depois'])} dias "
            f"em média (antes: {num(f['dias_limpo_antes'])}), {num(f['acerto_alagamentos_pct'])}% "
            f"dos alagamentos ocorridos tinham alerta prévio e as bocas de lobo limpas antes de "
            f"chuva forte passaram de {num(f['bocas_de_lobo_antes_pct'])}% para "
            f"{num(f['bocas_de_lobo_depois_pct'])}%. A estimativa é de "
            f"{num(f['horas_economizadas_por_trimestre'])} horas de equipe economizadas por "
            "trimestre. Para o servidor: menos retornos e decisões justificadas. Para o cidadão: "
            "rua limpa por mais tempo e menos alagamento. Dados simulados; o efeito do plano é "
            "uma premissa."
        )
    if context == "point":
        status = (
            f"é reincidente crônico: {num(f['episodios_em_15_dias'])} episódios em 15 dias"
            if f.get("reincidente_cronico")
            else f"teve {num(f['episodios_em_15_dias'])} episódio(s) em 15 dias"
        )
        hour = (
            f" O descarte se concentra entre {f['horario_provavel']}, bom horário para "
            "fiscalização."
            if f.get("horario_provavel")
            else ""
        )
        flood = (
            f" Fica perto de {f['area_de_alagamento_proxima']} (risco de alagamento "
            f"{num(f['risco_de_alagamento_72h'])}/100 em 72 h): o lixo daqui pode entupir a "
            "drenagem."
            if f.get("area_de_alagamento_proxima")
            else ""
        )
        advice = (
            " Limpeza sozinha não resolve: combine placa, ação porta a porta, fiscalização e "
            "recuperação do espaço."
            if f.get("reincidente_cronico")
            else ""
        )
        return f"Resumo do ponto {f['ponto']}", (
            f"O ponto {f['ponto']} ({f['bairro']}, {f['tipo_de_residuo']}) {status}. O lixo volta "
            f"em média a cada {num(f.get('intervalo_medio_dias'))} dias (média da cidade: "
            f"{num(f.get('intervalo_medio_cidade_dias'))}). Próximo acúmulo previsto: "
            f"{f.get('proximo_acumulo') or 'sem previsão'} (confiança "
            f"{f.get('confianca_da_previsao') or '—'}). Nos últimos 30 dias, o local consumiu "
            f"{num(f['horas_de_equipe_30_dias'])} horas de equipe.{hour}{flood}{advice}"
        )
    return f"Resumo — {f['area']}", (
        f"{f['area']}: risco de alagamento {num(f['risco_72h'])}/100 ({f.get('nivel_72h') or '—'}) "
        f"nas próximas 72 horas (agora: {num(f['risco_agora'])}; 24 h: {num(f['risco_24h'])}; "
        f"3 meses: {num(f['risco_3_meses'])}). O número combina a chuva prevista "
        f"({num(f['chuva_prevista_24h_mm'])} mm em 24 h), o histórico da área "
        f"({num(f['alagamentos_por_ano'])} alagamentos por ano), "
        f"{num(f['bocas_de_lobo_entupidas'])} de {num(f['bocas_de_lobo_total'])} bocas de lobo "
        f"entupidas e {num(f['pontos_de_lixo_proximos'])} ponto(s) de lixo por perto. Limpar as "
        "bocas de lobo e recolher o lixo antes da chuva reduz o risco."
    )
