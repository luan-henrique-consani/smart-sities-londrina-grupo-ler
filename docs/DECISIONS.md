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
