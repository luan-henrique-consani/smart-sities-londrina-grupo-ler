# Londrina Limpa — Prompt Mestre

Você vai construir, fase por fase, o MVP da "Londrina Limpa" para um hackathon. Trabalhe uma fase por vez: execute apenas a fase pedida pelo usuário e só avance para a próxima quando ele enviar. Os prompts das fases estão em docs/PROMPTS_FABLE_Londrina_Limpa.md.

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
