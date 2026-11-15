# HANDOFF — Fase 3 (API FastAPI)

Branch de trabalho: `wip/fase-3-backup` (nada foi enviado à `main`).

## Estado
A sessão anterior deixou a API quase completa. Nesta retomada **não houve reescrita**: só correções
pontuais, testes de integração e verificação.

### Já existia (commit `f4f39bb`)
Config, logging JSON com mascaramento, erros padronizados, Argon2 + JWT em cookie, RBAC, repositório
JSON + store em memória, schemas, serviços (views, templates, LLM com fallback) e todos os routers
registrados em `backend/main.py`.

### Feito agora
- `ruff.toml`: `extend-immutable-calls` para `Depends/Query/Path/Body` (idioma do FastAPI, falso B008).
- `routers/ai.py` e `routers/points.py`: dependências de RBAC em variáveis de módulo.
- Quebras de linha em `json_repository.py` e `overview.py` (E501).
- `tests/test_api.py` (100 testes): login ok/falho, cookie httpOnly/Secure/Lax/8 h, 429 com
  `Retry-After`, logout com revogação, token inválido/expirado, 401/403 por perfil, 404, 422 (sem
  ecoar senha), 405, 500 sem stack trace, `X-Request-ID`, filtros/paginação, horizontes,
  decisões, fallback do LLM (sem chave, com erro/timeout, modo `api` simulado sem dados pessoais),
  logs do cliente (máscara e limite), OpenAPI e prontidão para Vercel.

## Verificação (local)
- `pytest`: **145 passed** (leva ~1 min, por causa do Argon2 em cada login).
- `ruff check .`: limpo. `compileall`: ok. Dados: ~3,1 MB.
- **Não executado:** deploy real na Vercel (sem CLI/credenciais aqui) e `next build`/lint do frontend.

## Critérios de aceite da Fase 3
| Critério | Situação |
|---|---|
| Repository + fallback de seed (CRITICAL) | Cumprido |
| `/api/auth/*`, Argon2, JWT cookie, 5 tentativas/min, RBAC | Cumprido |
| Todas as rotas do prompt, com pydantic, paginação e filtros | Cumprido |
| Serviço de LLM (timeout 15 s, fallback, `mode`) | Cumprido |
| request_id, logs JSON mascarados, erros no formato padrão | Cumprido |
| Testes (login, 401/403, 404, 422, 429, rotas, fallback) | Cumprido |
| `/api/docs` documenta tudo | Cumprido (testado via OpenAPI) |
| Deploy na Vercel funcionando | **Pendente de confirmação**: config validada em teste (`api/index.py`, `includeFiles`, rewrite), mas é preciso publicar e testar `/api/health` |

## Pendências / atenção
1. Definir `JWT_SECRET` na Vercel (sem ele o segredo é efêmero e as sessões caem entre instâncias; há log CRITICAL).
2. Publicar e testar `/api/health`, `/api/meta` e um login na URL da Vercel.
3. Revogação de token e rate limit são por instância (memória): limitação conhecida do MVP.
4. Senha `Limpa-*-2026` está no README (exigido para a demo).
5. `ruff format` reformataria 7 arquivos; não foi aplicado (fora do escopo).
6. Não iniciar a Fase 4 sem pedido.
