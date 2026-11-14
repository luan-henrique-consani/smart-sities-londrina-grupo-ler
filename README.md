# Londrina Limpa

Plataforma web de **gestão preventiva** para a Prefeitura de Londrina (PR), com dois módulos sobre a mesma base de dados: **Resíduos** (descarte irregular e entulho) e **Alagamentos**. MVP de hackathon — **todos os dados são simulados**.

> Estado atual: **Fase 2** (dados simulados e modelos de previsão prontos). A página inicial ainda é provisória e só confirma que o site e a API estão no ar.

**No ar:** <https://londrina-limpa.vercel.app> · [saúde da API](https://londrina-limpa.vercel.app/api/health) · [documentação da API](https://londrina-limpa.vercel.app/api/docs)

## Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4.
- **Backend:** Python + FastAPI, um único app, publicado como função serverless Python na Vercel (`api/index.py`).
- **Dados:** arquivos JSON em `data/` (somente leitura na Vercel).

## Estrutura

```
app/, components/, lib/   frontend Next.js
api/index.py              entrada da função Python na Vercel
backend/                  pacote FastAPI (routers, services, repositories, models, core)
data/                     JSON de seed (dados simulados)
scripts/                  py.mjs (roda o Python do .venv) e generate_data.py (dados simulados)
tests/                    pytest
docs/                     DECISIONS.md e prompts das fases
vercel.json               função Python + rewrites de /api/*
```

## Como rodar localmente

Pré-requisitos: Node.js 20+ e Python 3.11+.

```bash
# 1. Dependências do frontend
npm install

# 2. Ambiente Python
python -m venv .venv
# Windows:
.venv\Scripts\python -m pip install -r requirements-dev.txt
# macOS/Linux:
.venv/bin/python -m pip install -r requirements-dev.txt

# 3. Sobe o Next (porta 3000) e o FastAPI (porta 8000) juntos
npm run dev
```

Abra <http://localhost:3000>. Em desenvolvimento, o Next encaminha `/api/*` para o uvicorn em `http://127.0.0.1:8000`.

- Saúde da API: <http://localhost:3000/api/health> → `{"status", "version", "time"}`
- Documentação da API (Swagger): <http://localhost:3000/api/docs>

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o frontend e a API juntos |
| `npm run dev:web` / `npm run dev:api` | Sobe só um dos dois |
| `npm run build` | Build de produção do Next |
| `npm run lint` | ESLint (frontend) + Ruff (Python) |
| `npm test` | Testes da API, das regras de negócio e dos dados (pytest) |
| `npm run data` | Regera os dados simulados em `data/` |

## Dados simulados e modelos de previsão

Todos os arquivos de `data/` são **simulados** e gerados por `scripts/generate_data.py` (seed fixo: o resultado é reproduzível; só `meta.generated_at` muda). As coordenadas são **aproximadas** (referência: OpenStreetMap).

```bash
npm run data
```

- **Período:** histórico de 01/2022 a 14/11/2026 (data de referência) e previsão até 02/2027. O "início das previsões" é 01/07/2026.
- **Volume:** 300 pontos de descarte em 17 bairros, cerca de 11 mil episódios, 18 áreas de alagamento e 108 bocas de lobo (≈ 3 MB no total).
- **Regras de negócio** (em `backend/services/`, Python puro, usadas pelo gerador e pela API):

| Regra | Onde | Resumo |
| --- | --- | --- |
| Episódio | `episodes.py` | Relatos a até 150 m e 48 h um do outro viram um episódio |
| Reincidente crônico | `recurrence.py` | 3 ou mais episódios em 15 dias (limites configuráveis) |
| Previsão de reaparecimento | `forecast.py` | Intervalo médio do ponto, ajustado por sazonalidade, com faixa de dias e confiança |
| Sazonalidade | `seasonality.py` | Natal e Ano-Novo, Carnaval, volta às aulas, chuvas de verão, ExpoLondrina, feriados |
| Risco de alagamento | `flood_risk.py` | Score 0–100: chuva em 3 h e 24 h, histórico, bocas de lobo entupidas, lixo próximo |
| Indicadores | `kpis.py` | Reincidência, dias limpo, previstos × ocorridos, bocas de lobo antes da chuva, horas economizadas |
| Sem ação × com plano | `projection.py` | Linha de base histórica do mês e efeito esperado do plano |

- **Arquivos:** `areas`, `points`, `episodes`, `cleanings`, `flood_areas`, `drains`, `flood_events`, `rain`, `forecasts`, `kpis`, `yearly`, `next3months`, `alerts`, `users` e `meta` (todos `.json`).
- **Importante:** os dados foram calibrados para reproduzir os valores de referência do protótipo (por exemplo, reincidência −34% com o plano e dias limpo de 6 para 11). Eles ilustram o funcionamento do sistema; **não são evidência de resultado real**. Detalhes em [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Usuários de demonstração

Contas fictícias, uma por perfil. Em `data/users.json` ficam só os hashes Argon2. O login entra na Fase 3.

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@londrinalimpa.example` | `Limpa-Admin-2026` |
| Gestor (CMTU/CTD) | `gestor@londrinalimpa.example` | `Limpa-Gestor-2026` |
| Técnico de campo | `tecnico@londrinalimpa.example` | `Limpa-Tecnico-2026` |
| Defesa Civil | `defesa@londrinalimpa.example` | `Limpa-Defesa-2026` |

Para trocar as senhas, rode o gerador com `DEMO_PASSWORDS="admin=...,gestor=...,tecnico=...,defesa_civil=..."` e atualize esta tabela.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha. Nunca faça commit de valores reais.

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `JWT_SECRET` | a partir da Fase 3 | Assinatura do JWT de sessão |
| `ANTHROPIC_API_KEY` | não | Sem chave, os textos usam o modo fallback (templates) |
| `ANTHROPIC_MODEL` | não | Modelo usado quando há chave |
| `SENTRY_DSN` | não | Monitoramento de erros (opcional) |

Na Fase 1 nenhuma variável é necessária.

## Como publicar na Vercel

O frontend e a API ficam no **mesmo projeto** da Vercel. O `vercel.json` define:

- `framework: nextjs` (build do Next);
- a função Python `api/index.py`, com `includeFiles: "data/**"` para levar os JSON no bundle;
- o rewrite de `/api/(.*)` para a função.

```bash
npm i -g vercel        # se ainda não tiver a CLI
vercel login
vercel                 # deploy de preview (na primeira vez, cria/vincula o projeto)
vercel --prod          # deploy de produção
```

Variáveis de ambiente: `vercel env add NOME` (ou no painel do projeto, em Settings → Environment Variables).

Depois do deploy, confira `https://SEU-DOMINIO/api/health` e `https://SEU-DOMINIO/api/docs`.

## Limitações conhecidas do MVP

- O sistema de arquivos da Vercel é somente leitura e efêmero: os JSON de `data/` são apenas o seed.
- A partir da Fase 3, toda escrita vai para um store em memória, que zera a cada cold start.
- Todos os dados são simulados.

Decisões de projeto: [`docs/DECISIONS.md`](docs/DECISIONS.md).
