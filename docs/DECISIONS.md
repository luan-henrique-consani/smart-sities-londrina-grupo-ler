# Decisões de projeto

Registro curto das decisões tomadas quando havia ambiguidade. Regra: a opção mais simples que funcione.

## Fase 1

1. **Função Python em `api/index.py` (e não Vercel Services).** A documentação atual da Vercel (nov/2026) recomenda "Services" para combinar Python com outro framework, mas ainda suporta funções por arquivo em `/api`. Mantivemos o padrão pedido no Prompt Mestre: `vercel.json` fixa `"framework": "nextjs"` e reescreve `/api/(.*)` para `/api/index`. Se esse modo deixar de funcionar, o plano B é migrar para Services.
2. **Proxy de desenvolvimento no `next.config.ts`.** Só em `NODE_ENV=development` o Next reescreve `/api/*` para `http://127.0.0.1:8000`. Em produção o rewrite é o do `vercel.json`.
3. **Sem `pyproject.toml`.** A Vercel usa `pyproject.toml` para detectar entrada e dependências Python; para não interferir no modo `/api`, as dependências ficam em `requirements.txt` e as configurações de ferramentas em `ruff.toml` e `pytest.ini`.
4. **`requirements.txt` já com todas as dependências de runtime** (FastAPI, argon2-cffi, PyJWT, httpx, anthropic), para validar no primeiro deploy a instalação de pacotes nativos e o tamanho do bundle. Ferramentas de desenvolvimento ficam em `requirements-dev.txt`.
5. **Python 3.12 na Vercel** (`.python-version`); o código é mantido compatível com 3.11 para rodar nas máquinas do grupo.
6. **`/api/health` devolve `status: "degraded"`** quando a pasta `data/` não é encontrada. Assim o próprio health check prova que os JSON entraram no bundle da função.
7. **Scripts npm chamam o Python do `.venv`** por meio de `scripts/py.mjs`, para funcionar igual em Windows, macOS e Linux.

## Fase 2

1. **Data de referência fixa: 14/11/2026 às 6h.** É o "agora" dos dados (histórico até a véspera, previsão a partir daí). `meta.generated_at` guarda o horário real da geração, usado em "Atualizado às HH:MM".
2. **Dados calibrados para os valores de referência do protótipo.** O gerador é uma simulação construída para contar a história pedida; não é evidência de resultado real. Os indicadores são sempre calculados pelos serviços a partir dos dados brutos (os testes recalculam), mas os parâmetros da simulação foram ajustados para chegar aos valores de referência:
   - *Dias limpo 6 → 11:* intervalo entre limpeza e novo despejo nos pontos reincidentes, antes e depois de jul/2026.
   - *12 reincidentes crônicos:* 12 pontos "recaem" nas últimas 3 semanas (despejo a cada 3–4 dias).
   - *3 áreas em risco alto em 72 h:* a chuva prevista para 15/11 é a menor que deixa exatamente 3 áreas acima de 70 pontos.
   - *78% de acerto:* dos alagamentos ocorridos desde jul/2026, 78% são marcados como tendo alerta prévio (os de áreas mais suscetíveis e chuvas mais fortes).
   - *Bocas de lobo 41% → 82%:* cota de bocas de lobo limpas nos 7 dias antes de cada chuva forte, antes e depois do sistema.
   - *≈1.240 h economizadas:* limpezas evitadas × média de horas de equipe por limpeza; a média de horas da simulação é escolhida para chegar perto desse valor.
3. **Efeito do plano é uma premissa, não uma medição.** "Com o plano" = linha de base histórica do mês × (1 − 34%) para retornos de lixo e × (1 − 30%) para alagamentos (`backend/services/projection.py`). A linha de base "sem ação" é a média do mesmo mês nas temporadas 2022/23 a 2025/26.
4. **Cenário de clima escolhido.** A chuva é sorteada e pode esconder a melhora nos alagamentos; o gerador testa seeds de clima em sequência e usa o primeiro em que a melhora a partir de jul/2026 aparece também nos números brutos e em que o verão concentra os alagamentos. O seed usado fica em `meta.weather_seed`.
5. **Definições adotadas para os indicadores:**
   - *Retorno (reincidência):* episódio que começa até 30 dias depois do anterior no mesmo ponto.
   - *Dias limpo:* dias entre uma limpeza e o episódio seguinte, só para limpezas cujo retorno já foi observado, nos pontos que já foram reincidentes crônicos.
   - *Chuva forte:* 30 mm ou mais em 24 h. *Antes da chuva:* limpeza nos 7 dias anteriores.
   - *Comparação antes × depois:* 1º/jul a 14/nov de 2025 contra o mesmo período de 2026, para não misturar estações.
   - *Entulho previsto em 7 dias:* pontos cuja data mais provável de acúmulo fica entre 3 dias atrás e 7 dias à frente, com confiança média ou alta.
6. **2026 é um ano parcial** (até 14/11). `yearly.json` traz, para cada ano, o ano inteiro, o período jan–14/nov e o período jul–14/nov, para que as telas comparem períodos iguais.
7. **Serviços em Python puro; numpy só no gerador** (`requirements-dev.txt`), para manter a função serverless leve.
8. **Senhas de demonstração fora do código.** O gerador só cria `data/users.json` se o arquivo não existir ou se as senhas vierem na variável `DEMO_PASSWORDS`; sem ela, sorteia senhas e as imprime uma vez. As senhas ficam apenas no README.
9. **Coordenadas aproximadas.** Centros dos bairros conferidos no OpenStreetMap (Nominatim) quando encontrados; Jardim Quebec, Jardim Leonor e Lago Igapó foram estimados. Os pontos são sorteados em torno desses centros e podem cair sobre quadras, ruas ou água.
10. **Horário de Brasília fixo (UTC−3)** no gerador, sem depender do banco de fusos do sistema (ausente no Windows).
