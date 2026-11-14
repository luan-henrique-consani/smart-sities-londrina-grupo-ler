# Londrina Limpa — Prompts para o Fable (Claude Code)

**Como usar**
1. Abra o Claude Code na pasta do repositório do GitHub (já clonado).
2. Cole o **Prompt Mestre** primeiro. Ele dá o contexto e as regras e não pede código ainda.
3. Cole as **Fases 1 a 7**, uma de cada vez. Só passe para a próxima quando a anterior terminar com build e testes passando e com o commit feito.
4. Tempo sugerido (sábado à noite → domingo 7h): F1 45 min · F2 1h30 · F3 1h30 · F4 2h · F5 2h · F6 1h · F7 1h30.
5. Se o tempo apertar, corte nesta ordem: painel público → detalhes da tela de saúde → exportar/excluir dados → amplitude dos testes E2E. **Nunca corte:** mapa com pontos, previsões, comparativo de melhorias, login.

---

## PROMPT MESTRE

```
Você vai construir, fase por fase, o MVP da "Londrina Limpa" para um hackathon. Neste primeiro momento, NÃO escreva código: leia tudo, confirme o entendimento em um resumo curto, aponte riscos técnicos e espere a Fase 1.

## Contexto
- Plataforma web de gestão preventiva para a Prefeitura de Londrina (PR): CMTU (limpeza urbana), CTD (dona do app Londrina ON) e Defesa Civil.
- Dois módulos com o MESMO peso, sobre uma base de dados comum:
  1. Resíduos: pontos de descarte irregular e entulho, previsão de quando o lixo volta, previsão de limpeza, detecção de reincidentes.
  2. Alagamentos: áreas de risco (ex.: Lago Igapó, Jardim Quebec, Centro), risco por horizonte (24 h, 72 h, 3 meses) a partir de chuva, histórico de eventos e bocas de lobo entupidas.
- O sistema SÓ ANALISA dados. Não é um "Londrina ON 2": não abre chamados de cidadãos.
- Público principal: servidor público que toma decisões. Perfis: Administrador, Gestor (CMTU/CTD), Técnico de campo, Defesa Civil. Um painel público com dados agregados, sem login, é OPCIONAL e fica por último.
- Apresentação: domingo, 15/11, às 8h. O sistema precisa estar publicado e testado até as 7h. São 5 minutos de apresentação, sendo 2 para mostrar como o sistema resolve o problema e justifica a melhora para a cidade.
- Referência visual (protótipo aprovado): https://claude.ai/artifact/5fu4kn7taT3HsPijJH1dba (o protótipo ainda pode mostrar o nome antigo "Londrina Preventiva"; o nome oficial é "Londrina Limpa")
  Telas: Mapa e alertas · Previsões e resultados · Ponto reincidente · Conscientização · Celular.
  Paleta: primária #0E6B60 · alagamento #1D5A96 · entulho #C2560C · crítico #B42318 · fundo #F5F6F3 · texto #1B1F1D. Fontes: Inter (texto) e Space Grotesk (títulos).

## Prioridade absoluta: MVP FUNCIONANDO
Funcionando vale mais que completo. Cada fase termina com build sem erro, testes passando e o app no ar. Nunca deixe o projeto quebrado entre fases. Se uma decisão for ambígua, escolha a opção mais simples que funcione e registre em docs/DECISIONS.md.

## Stack (obrigatória)
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS. Mapa com Leaflet + react-leaflet e tiles do OpenStreetMap (carregar com dynamic import e ssr:false). Gráficos com Recharts. Validação de formulários com zod.
- Backend: Python + FastAPI, um ÚNICO app, publicado como função serverless Python na MESMA conta/projeto da Vercel (padrão api/index.py, com rewrites de /api/* para o FastAPI). Antes de configurar, confira a documentação atual da Vercel para o runtime Python. Em desenvolvimento local, o Next faz proxy de /api para o uvicorn na porta 8000.
- "Banco de dados": arquivos JSON em /data (sem banco nesta fase). Atenção: o sistema de arquivos da Vercel é somente leitura e efêmero. Então:
  - os JSON de /data são o seed, somente leitura, e precisam ser incluídos no bundle da função (vercel.json → functions → includeFiles: "data/**");
  - toda escrita (decisões registradas, logs de cliente, pedidos de exclusão) vai para um store em memória que zera no cold start. Isso é uma limitação conhecida do MVP e deve ser documentada;
  - todo acesso a dados passa por uma camada Repository (interface), para trocar por PostgreSQL depois sem mexer nas rotas.
- Dependências Python leves (FastAPI, pydantic, argon2-cffi, PyJWT, httpx, anthropic). Evite pandas e scikit-learn na função serverless: as previsões pesadas são PRÉ-CALCULADAS por script e salvas em JSON.

## Dados (todos simulados, marcados como "simulado" na interface)
- Histórico de 2022 a 2026 e previsão para os próximos 3 meses (dez/2026 a fev/2027).
- Bairros/áreas (coordenadas aproximadas dentro de Londrina, centro ≈ -23.31, -51.16; confira no OpenStreetMap e marque como "aproximadas"): Lago Igapó, Jardim Quebec, Centro, fundo de vale do Ribeirão Cambé, Jardim Bandeirantes, Vila Nova, Cinco Conjuntos, Gleba Palhano, Zona Norte, Jardim Leonor e outros, até ~300 pontos de descarte e ~18 áreas de alagamento.
- Calibração pública: Londrina produziu em média ~377 t/dia de lixo doméstico em 2025 (Perfil de Londrina/CMTU). A CMTU limpou 904 bocas de lobo entre jan e set de 2025.
- Sazonalidade (todos os eventos): Natal e Ano-Novo, Carnaval (6 a 9/02/2027), volta às aulas, chuvas de verão (dez–mar), feriados prolongados, ExpoLondrina (abril). Carnaval e fim de ano elevam o entulho; chuvas de verão elevam o risco de alagamento.
- O Lago Igapó é o exemplo principal: lixo + chuva forte = transbordamento.
- A história dos dados precisa mostrar o efeito do sistema: a partir de jul/2026 ("início das previsões"), reincidência, alagamentos e dias até a limpeza melhoram em relação aos anos anteriores. O comparativo "sem ação preventiva × com o plano sugerido" aparece nos próximos 3 meses.

## Regras de negócio
- Episódio: relatos a até 150 m e 48 h um do outro contam como UM episódio (não inflar ocorrências).
- Reincidente crônico: 3 ou mais episódios no mesmo ponto em 15 dias (limite configurável). Gera alerta de reincidência + alerta de conscientização, com sugestões além da limpeza (placa, ação porta a porta, fiscalização no horário provável, recuperação do espaço).
- Previsão de reaparecimento de lixo: intervalo médio entre episódios do ponto, ajustado por sazonalidade, com faixa (ex.: "em 3 a 5 dias") e nível de confiança conforme a quantidade de dados.
- Risco de alagamento (0–100 → baixo/médio/alto): chuva prevista (mm em 3 h e 24 h), histórico de eventos da área, bocas de lobo entupidas próximas e pontos de lixo próximos.
- Indicadores obrigatórios: reincidência, dias que o ponto fica limpo, alagamentos previstos × ocorridos, bocas de lobo limpas antes de chuva forte, horas de equipe economizadas (estimativa).
- A atualização "quase em tempo real" (1 h) NÃO é do MVP. Mostre "Atualizado às HH:MM" a partir do horário de geração dos dados.

## IA (LLM)
- Os NÚMEROS vêm dos modelos estatísticos. O LLM só escreve textos: explicações dos números, alertas e materiais de conscientização (cartaz, post para redes, roteiro porta a porta, plano de ação de 30 dias).
- Use a API do Claude (SDK oficial "anthropic"), SOMENTE se existir ANTHROPIC_API_KEY, com o modelo definido por ANTHROPIC_MODEL. Não há chave nem orçamento hoje, então o modo padrão é FALLBACK: modelos de texto prontos, preenchidos com os números reais do ponto. A demo tem que funcionar 100% sem chave.
- Nunca envie dados pessoais ao LLM. Timeout de 15 s, com fallback automático se der erro.
- Todo texto gerado mostra o selo "Gerado por IA · revise antes de usar".

## Acessibilidade e inclusão (obrigatório)
- Interface em pt-BR. WCAG 2.1 AA: contraste mínimo de 4.5:1, navegação completa por teclado, foco visível, aria-labels, landmarks, alvos de toque de 44 px, texto que aguenta zoom de 200%.
- Botão de tema claro/escuro e botão de MODO DALTONISMO (paleta Okabe-Ito). As categorias nunca dependem só da cor: alagamento = círculo, entulho = quadrado, reincidente = losango, sempre com rótulo de texto.
- Responsivo mobile-first: precisa funcionar bem no celular e no computador.
- Gráficos com descrição textual (aria-label ou tabela alternativa).

## Segurança e LGPD
- Não coletamos NENHUM dado de cidadãos: o sistema guarda o problema, não a pessoa. Dos servidores, guardamos apenas nome, e-mail e cargo.
- Senhas com Argon2 (argon2-cffi). Os usuários demo ficam em data/users.json, só com hashes. As credenciais de demo vão apenas no README.
- Login simples com e-mail e senha (sem MFA). Sessão com JWT em cookie httpOnly, Secure e SameSite=Lax, expirando em 8 h. Controle de acesso por perfil (RBAC) em todas as rotas.
- Segredos só em variáveis de ambiente (JWT_SECRET, ANTHROPIC_API_KEY, ANTHROPIC_MODEL). Nada de segredo no código ou no Git (.env.example sem valores).
- HTTPS (padrão da Vercel) e cabeçalhos de segurança: CSP, HSTS, X-Content-Type-Options, X-Frame-Options/frame-ancestors, Referrer-Policy. CORS restrito ao domínio do app. Limite de tentativas de login (em memória). Validação de toda entrada (pydantic no back, zod no front).
- LGPD: página de Política de Privacidade; Termo de Consentimento aceito no primeiro login; exportar os próprios dados (JSON); pedir exclusão dos próprios dados; prazos de retenção documentados (5 anos para ocorrências, 6 meses para logs de acesso); trilha de auditoria de quem acessou dados pessoais; aviso para desfocar rostos e placas em fotos (upload de fotos fora do MVP).

## Logs e erros
- Logs estruturados em JSON no stdout (a Vercel captura), com request_id em toda requisição (cabeçalho X-Request-ID), níveis (DEBUG/INFO/WARNING/ERROR/CRITICAL) e mascaramento automático de dados pessoais (e-mail, nome, token, senha).
- Formato padrão de erro da API: {"error": {"code", "message", "request_id"}}, com tratadores globais para validação (422), autenticação (401), permissão (403), não encontrado (404), limite de tentativas (429) e erro inesperado (500, sem expor stack trace).
- Frontend: Error Boundary + window.onerror/unhandledrejection enviando para POST /api/logs/client. Mensagens amigáveis em pt-BR.
- Cenários que precisam ser tratados: entrada inválida, sessão expirada, sem permissão, recurso inexistente, arquivo JSON ausente ou corrompido (fallback para seed embutido + log CRITICAL), LLM com erro ou timeout (fallback de texto), tiles do mapa sem carregar (aviso + visão em lista), sem internet (faixa "offline" + últimos dados em cache), API lenta (skeletons, timeout e nova tentativa), erro inesperado.
- Tela "Saúde do sistema" (só Administrador): versão, uptime, dados carregados, modo do LLM (API/fallback), últimos erros (buffer em memória). Sentry é opcional, via variável de ambiente.

## Estrutura do repositório
/app, /components, /lib (frontend Next.js) · /api/index.py (entrada da função) · /backend (pacote FastAPI: routers, services, repositories, models, core) · /data (JSON) · /scripts (geração de dados) · /tests (pytest) · /e2e (Playwright) · /docs (DECISIONS.md, LGPD.md, DEMO.md) · README.md · vercel.json · .env.example

## Forma de trabalhar
- Uma fase por vez. No fim de cada fase: rodar lint, build e testes, corrigir até passar, atualizar o README e fazer commit com mensagem convencional (feat:, fix:, docs:, test:) no GitHub.
- Não apague arquivos fora do escopo sem perguntar. Não invente integrações reais (Londrina ON, INMET, SIGLON ficam documentadas como "próximos passos").
- Responda em português.
```

---

## FASE 1 — Base do projeto e deploy cedo

```
Fase 1: base do projeto e primeiro deploy.

1. Crie o monorepo conforme a estrutura do Prompt Mestre: Next.js (App Router, TS, Tailwind, ESLint) + FastAPI em /backend, com entrada em /api/index.py.
2. Configure vercel.json para: build do Next, função Python em api/index.py com includeFiles "data/**", e rewrites de /api/(.*) para o FastAPI. Configure o proxy de desenvolvimento (Next → uvicorn :8000).
3. FastAPI com docs_url="/api/docs" e openapi_url="/api/openapi.json". Crie GET /api/health → {status, version, time}.
4. Página inicial provisória que chama /api/health e mostra o status.
5. Scripts: "dev" (sobe front e back juntos), "build", "lint", "test". requirements.txt enxuto. .env.example.
6. README inicial: como rodar local, como publicar na Vercel, variáveis de ambiente.
7. Publique na Vercel AGORA (preview). Me passe a URL e confirme que /api/health responde no computador e no celular.

Critério de aceite: URL pública funcionando, /api/health e /api/docs ok, build e lint sem erros, commit "chore: base do projeto".
```

## FASE 2 — Dados simulados e modelos de previsão

```
Fase 2: dados simulados e modelos de previsão (offline, pré-calculados).

1. Crie scripts/generate_data.py (Python puro + numpy, com seed fixo para ser reproduzível), que gera em /data:
   - areas.json (bairros/áreas com polígono ou centro + raio, coordenadas aproximadas)
   - points.json (~300 pontos de descarte: id "D-0001", área, coordenadas, tipo de resíduo)
   - episodes.json (episódios 2022–2026, já agrupados pela regra de 150 m / 48 h, com nº de relatos agrupados)
   - cleanings.json (limpezas e vistorias simuladas, com data e horas de equipe)
   - flood_areas.json (~18 áreas: Lago Igapó, Jd. Quebec, Centro…), drains.json (bocas de lobo com status)
   - flood_events.json (alagamentos 2022–2026), rain.json (chuva diária simulada com sazonalidade de verão)
   - forecasts.json (por ponto: próximo acúmulo previsto em faixa de dias + confiança; por área de alagamento: risco 0–100 em 24 h, 72 h e 3 meses)
   - kpis.json, yearly.json (comparativo 2022–2026), next3months.json (dez/26–fev/27: "sem ação" × "com plano")
   - alerts.json (risco alto de alagamento, reincidência crônica, evento sazonal, entulho previsto)
   - users.json (4 usuários demo, um por perfil, senha com hash Argon2; senhas em texto só no README)
   - meta.json (generated_at, versão, aviso "dados simulados")
2. Implemente as regras do Prompt Mestre em /backend/services (agrupamento de episódios, reincidente crônico com limite configurável, previsão de reaparecimento com sazonalidade, score de risco de alagamento, cálculo dos 5 KPIs). O script usa esses mesmos serviços.
3. A narrativa dos dados precisa mostrar: Carnaval e fim de ano com picos de entulho; verão com picos de alagamento no Igapó; melhora visível a partir de jul/2026; uns 12 reincidentes crônicos ativos; 3 áreas com risco alto nas próximas 72 h. Valores de referência do protótipo: reincidência −34% nos próximos 3 meses com o plano; dias limpo 6 → 11; 78% de acerto em alagamentos previstos × ocorridos; bocas de lobo limpas antes da chuva 41% → 82%; ≈1.240 h de equipe economizadas por trimestre.
4. Testes pytest das regras: agrupamento, limite de 15 dias, faixas de previsão, score de risco, KPIs.

Critério de aceite: script gera todos os JSON sem erro, os testes passam, os JSON são válidos e pequenos (< 5 MB no total). Commit "feat: dados simulados e modelos".
```

## FASE 3 — API (FastAPI)

```
Fase 3: API completa sobre os JSON.

1. Camada Repository (interface + implementação JSON somente leitura + store em memória para escritas). Carregue o seed na inicialização. Se um arquivo estiver ausente ou corrompido, use o seed embutido mínimo e registre log CRITICAL.
2. Autenticação: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me. Argon2 para verificar senha, JWT em cookie httpOnly/Secure/SameSite=Lax, expiração de 8 h, limite de 5 tentativas por minuto por IP. RBAC por dependência do FastAPI.
3. Rotas (todas com schemas pydantic, paginação quando for lista e filtros validados):
   GET /api/points?type=&risk=&area=&horizon= · GET /api/points/{id} (histórico de episódios, limpezas, previsão, status de reincidência, padrão de horário)
   GET /api/flood-areas?horizon=24h|72h|3m · GET /api/alerts · GET /api/kpis
   GET /api/forecasts/yearly · GET /api/forecasts/next-3-months · GET /api/forecasts/seasonal-calendar
   POST /api/points/{id}/decisions (registra recomendação → decisão → intervenção; fica no store em memória)
   POST /api/ai/awareness {point_id, material: poster|social|door_to_door|action_plan, audience, tone}
   GET /api/ai/explain/{context} (explicação dos números de uma tela)
   GET /api/meta (generated_at, aviso de simulação)
4. Serviço de LLM: usa o SDK anthropic só se ANTHROPIC_API_KEY existir (modelo por ANTHROPIC_MODEL), com timeout de 15 s e fallback para templates em pt-BR preenchidos com os números do ponto. Não envia dados pessoais. A resposta indica "mode": "api"|"fallback".
5. Middleware de request_id, logs JSON com mascaramento de dados pessoais e tratadores globais de erro no formato {"error":{code,message,request_id}}.
6. Testes pytest com TestClient: login ok e falho, 401/403 por perfil, 404, 422, 429, rotas principais e fallback do LLM.

Critério de aceite: /api/docs documenta tudo, testes passam, deploy na Vercel funcionando. Commit "feat: API".
```

## FASE 4 — Frontend base e mapa

```
Fase 4: frontend base e tela de Mapa e alertas (siga o protótipo).

1. Layout: menu lateral no computador e barra inferior no celular. Itens: Mapa e alertas, Previsões e resultados, Pontos reincidentes, Conscientização (e Saúde do sistema, só para Administrador).
2. Tela de login (e-mail e senha, validação com zod, mensagens de erro claras) e proteção das rotas por perfil.
3. Provedores globais: tema claro/escuro e modo daltonismo (Okabe-Ito), os dois com botão no cabeçalho, salvos em localStorage com try/catch e respeitando prefers-color-scheme.
4. Mapa (react-leaflet, dynamic import, ssr:false, tiles do OSM com atribuição): camadas que ligam e desligam (Alagamento = círculo, Entulho = quadrado, Reincidente crônico = losango), halos de risco nas áreas de alagamento, seletor de horizonte (Agora, +24 h, +72 h, +3 meses), popup com resumo e link para o ponto, legenda acessível. Se os tiles falharem, mostre aviso e uma visão em lista.
5. Cartões de KPI (3 áreas com risco alto em 72 h, entulho previsto em 7 dias, reincidentes crônicos, bocas de lobo limpas antes da chuva) e painel de alertas clicáveis.
6. Cliente de API com timeout, nova tentativa e tratamento padrão de erros; skeletons de carregamento; faixa "offline"; Error Boundary; envio de erros para /api/logs/client.
7. Selo "Dados simulados" e "Atualizado às HH:MM" (de /api/meta).

Critério de aceite: funciona em 375 px e em 1440 px, navegável só pelo teclado, sem erro no console, deploy ok. Commit "feat: mapa e layout".
```

## FASE 5 — Previsões, ponto reincidente e conscientização

```
Fase 5: telas de valor (é o que será mostrado nos 2 minutos principais da demo).

1. Previsões e resultados: 4 KPIs de impacto (reincidência −34%, dias limpo 6 → 11, acerto em alagamentos de 78%, ≈1.240 h economizadas); gráficos (Recharts) de entulho por ano e de alagamentos por ano (2022–2026, com 2026 destacado); próximos 3 meses "sem ação × com plano" (dez, jan e fev, com o Carnaval); calendário de riscos sazonais; filtro por módulo (os dois, Resíduos, Alagamentos); bloco "Resumo gerado por IA" vindo de /api/ai/explain. Cada gráfico com descrição acessível e tabela alternativa.
2. Ponto reincidente (/pontos/[id]): selo de reincidente crônico, cartões (próximo acúmulo previsto, intervalo médio de retorno × média da cidade, horas de equipe no mês, risco de alagamento ligado), linha do tempo de episódios agrupados, padrão de horário detectado, alerta "limpeza sozinha não resolve" com ações sugeridas, botão "Registrar decisão" (modal → POST decisions) e botão "Gerar materiais de conscientização".
3. Lista de pontos reincidentes com filtros e ordenação.
4. Conscientização: abas Cartaz / Post para redes / Porta a porta / Plano de ação de 30 dias; seletores de público e tom; botão "Gerar outra versão" (POST /api/ai/awareness); prévia do cartaz em A4 com CSS de impressão e botão "Baixar PDF" (window.print com folha de estilo de impressão); botão de copiar o texto. Use placeholders como [PONTO DE ENTREGA MAIS PRÓXIMO] e [LOGO DA PREFEITURA] (não use logos oficiais). Selo "Gerado por IA · revise".
5. Explique na interface, em linguagem simples, o ganho para o servidor (menos retornos, decisões justificadas) e para o cidadão (rua limpa por mais tempo, menos alagamento).

Critério de aceite: fluxo completo mapa → ponto → materiais funcionando no computador e no celular, em modo fallback (sem chave de API). Commit "feat: previsões, pontos e conscientização".
```

## FASE 6 — Segurança, LGPD e observabilidade

```
Fase 6: segurança, LGPD e saúde do sistema.

1. Cabeçalhos de segurança no Next (next.config headers) e no FastAPI: CSP compatível com os tiles do OSM e com as fontes, HSTS, X-Content-Type-Options, frame-ancestors 'none', Referrer-Policy, Permissions-Policy. CORS restrito.
2. Revise a sessão: cookie httpOnly/Secure/SameSite, expiração, logout que invalida o token, proteção CSRF nas rotas POST (cabeçalho customizado ou double submit).
3. LGPD: páginas /privacidade e /termos; Termo de Consentimento obrigatório no primeiro login (registra data e versão); "Meus dados" com exportação em JSON (GET /api/privacy/my-data) e pedido de exclusão (DELETE /api/privacy/my-data → registra o pedido e remove do store em memória); docs/LGPD.md com base legal, dados tratados, retenção (5 anos para ocorrências, 6 meses para logs de acesso) e contato do encarregado [A DEFINIR].
4. Auditoria: registre quem acessou ou exportou dados pessoais (ação, usuário mascarado, horário, request_id).
5. Logs: confirme o mascaramento (testes provando que e-mail, nome, token e senha nunca aparecem em texto puro), níveis corretos e POST /api/logs/client com validação e limite de tamanho.
6. Tela "Saúde do sistema" (só Administrador): versão, uptime, generated_at dos dados, modo do LLM, contagem de erros por nível e últimos 20 erros (buffer em memória). Integração opcional com Sentry por variável de ambiente.

Critério de aceite: testes de segurança passam (rota protegida sem cookie = 401, perfil errado = 403, cabeçalhos presentes), nenhum segredo no repositório. Commit "feat: segurança e LGPD".
```

## FASE 7 — Testes, polimento e roteiro da demo

```
Fase 7: testes, polimento e preparação da demo (prazo: tudo publicado até domingo às 7h).

1. Testes: complete o pytest (meta de 70% de cobertura nos services e routers); Vitest + Testing Library nos componentes principais (KPI, alerta, alternância de tema/daltonismo, formulário de login); Playwright E2E em dois tamanhos de tela (desktop 1440 e celular 390): login → mapa → abrir ponto reincidente → ver previsão → gerar cartaz → ver previsões e resultados → logout. Inclua um teste com a API de clima/LLM falhando (fallback).
2. Acessibilidade: rode axe (via @axe-core/playwright) nas telas principais e corrija tudo que for crítico ou sério. Rode o Lighthouse e mire em 90+ de acessibilidade.
3. Desempenho: carregue o mapa e os gráficos sob demanda, comprima o JSON e confira o cold start da função Python.
4. README final: o que é o projeto, problema → solução, arquitetura (diagrama em Mermaid), como rodar, como publicar, variáveis de ambiente, usuários demo, limitações do MVP (JSON somente leitura, store em memória, dados simulados) e próximos passos (Londrina ON via CTD, INMET/Simepar, SIGLON, PostgreSQL/PostGIS, atualização a cada 1 h, painel público).
5. docs/DEMO.md: roteiro de 5 minutos, cronometrado:
   0:00–0:45 problema (lixo que volta, alagamento no Igapó, dados que não se conversam)
   0:45–2:45 SOLUÇÃO (2 min): mapa com riscos → alerta do Igapó → ponto reincidente → "limpeza sozinha não resolve" → cartaz gerado → previsões e resultados (−34% de reincidência, 6 → 11 dias limpo, 78% de acerto, ≈1.240 h economizadas)
   2:45–3:45 inclusão (tema escuro, modo daltonismo, celular do técnico) e LGPD (não coletamos dados de cidadãos)
   3:45–5:00 próximos passos com a CTD/Londrina ON e impacto para o servidor e para o cidadão
   Inclua um plano B caso a internet falhe (vídeo gravado ou execução local).
6. Deploy final em produção na Vercel e checklist: abre no computador e no celular, login com cada perfil, nenhum erro no console, /api/docs ok, modo fallback ok.

Critério de aceite: todos os testes verdes, deploy de produção funcionando, README e DEMO.md prontos. Commit "chore: release da demo". Me entregue a URL final e a lista do que ficou fora do MVP.
```
