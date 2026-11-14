# Londrina Limpa

Plataforma web de **gestão preventiva** para a Prefeitura de Londrina (PR), com dois módulos sobre a mesma base de dados: **Resíduos** (descarte irregular e entulho) e **Alagamentos**. MVP de hackathon — **todos os dados são simulados**.

> Estado atual: **Fase 1** (base do projeto e primeiro deploy). A página inicial é provisória e só confirma que o site e a API estão no ar.

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
scripts/                  utilitários (py.mjs, geração de dados)
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
| `npm test` | Testes da API (pytest) |

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
