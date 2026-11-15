# Roteiro da demo — Prevora (5 minutos)

Apresentação: domingo, 15/11, às 8h. Todos os dados são **simulados** (diga isso logo no início).

**URL:** <https://londrina-limpa.vercel.app> (o projeto da Vercel mantém o nome antigo; o produto é a **Prevora**).

## Antes de subir ao palco (checklist de 3 minutos)

- [ ] Abrir a URL no computador **e** no celular; conferir `/api/health` → `{"status":"ok"}`.
- [ ] Entrar com o **Gestor** (`gestor@londrinalimpa.example` / `Limpa-Gestor-2026`) e aceitar o Termo de Consentimento **antes** da apresentação (o aceite viaja no cookie; evita o passo na frente do público).
- [ ] Já deixar abertas, em abas: `/mapa`, `/pontos`, `/previsoes`. Deixar o tema **claro** (projetor) e o zoom em 110–125%.
- [ ] Segunda aba/janela do celular (ou espelhamento) logada como **Técnico** (`tecnico@londrinalimpa.example` / `Limpa-Tecnico-2026`).
- [ ] Wi-Fi do local testado. Plano B pronto (final deste documento).
- [ ] Lembrete: sem chave de IA, os textos usam o **modo fallback** (modelos prontos com os números reais). Isso é esperado e funciona 100%.

## Linha do tempo

| Tempo | Bloco | O que fazer na tela | O que dizer |
| --- | --- | --- | --- |
| **0:00–0:45** | **Problema** | Slide ou a tela de login (`/login`) | O lixo volta no mesmo ponto; no Lago Igapó, lixo + chuva forte = transbordamento; e CMTU, CTD e Defesa Civil têm dados que não conversam. Hoje a cidade **responde**; queremos que ela **antecipe**. |
| **0:45–1:15** | **Solução: mapa com riscos** | `/mapa`: camadas (círculo = alagamento, quadrado = entulho, losango = reincidente), horizonte **+72 h** | Três áreas com risco alto nas próximas 72 h. Cada ponto tem forma **e** rótulo, nunca só cor. |
| **1:15–1:40** | **Alerta do Igapó** | Clicar no alerta do Lago Igapó (painel de alertas) → popup/resumo | Risco 0–100 vem de chuva prevista, histórico, bocas de lobo entupidas e lixo próximo. Dá para agir **antes** da chuva. |
| **1:40–2:05** | **Ponto reincidente** | `/pontos` → abrir o primeiro ponto crônico | 3 ou mais episódios em 15 dias. Previsão: o lixo volta em X a Y dias. Linha do tempo agrupada (relatos a 150 m e 48 h contam como um episódio). |
| **2:05–2:25** | **"Limpeza sozinha não resolve"** | Alerta e ações sugeridas; **Registrar decisão** (abrir o modal, salvar) | Placa, porta a porta, fiscalização no horário provável, recuperação do espaço. A decisão fica registrada e justificada. |
| **2:25–2:40** | **Cartaz gerado** | **Gerar materiais de conscientização** → aba **Cartaz** → mostrar selo "Gerado por IA · revise antes de usar" | Cartaz A4 pronto para imprimir (Baixar PDF). Os **números** vêm do modelo estatístico; a IA só escreve o texto. Funciona até sem internet de IA. |
| **2:40–2:45** | Transição | — | "E o que isso muda?" |
| **2:45–3:15** | **Resultados (os 4 números)** | `/previsoes` (KPIs de impacto, gráficos por ano, "sem ação × com plano") | **−34%** de reincidência · dias limpo **6 → 11** · **78%** de acerto em alagamentos previstos × ocorridos · **≈1.240 h** de equipe economizadas por trimestre. Frisar: estimativa sobre dados simulados. |
| **3:15–3:45** | **Inclusão** | Botão de tema escuro; botão **Acessibilidade** (daltonismo); mostrar o celular do Técnico | WCAG 2.1 AA, teclado, contraste ≥ 4,5:1, mobile-first. O técnico de campo usa no celular. |
| **3:45–4:05** | **LGPD** | `/meus-dados` (exportar) ou `/privacidade` | Não coletamos **nenhum** dado de cidadãos: guardamos o problema, não a pessoa. Do servidor, só nome, e-mail e cargo. Auditoria e exclusão previstas. |
| **4:05–5:00** | **Próximos passos e impacto** | Slide final | Integração com o **Londrina ON** (CTD), INMET/Simepar, SIGLON, PostgreSQL/PostGIS, atualização a cada 1 h, painel público. **Servidor:** menos retornos, decisão justificada. **Cidadão:** rua limpa por mais tempo, menos alagamento. |

## Frases-âncora (se travar)

- "A Prevora **só analisa**; não abre chamado e não coleta dado de cidadão."
- "Números = modelo estatístico. Texto = IA, sempre com revisão humana."
- "Tudo aqui é simulado e marcado como simulado; o que importa é o fluxo: prever → decidir → agir → medir."

## Perguntas prováveis

- **"Os 78% são reais?"** São calibrados sobre dados simulados para ilustrar o indicador. Com dados reais do Londrina ON/Defesa Civil, o mesmo cálculo mede o acerto real.
- **"E se a IA errar?"** Todo texto tem o selo "revise antes de usar", nunca recebe dados pessoais e há fallback automático por modelo de texto.
- **"Onde ficam os dados?"** Arquivos JSON somente leitura (seed) + store em memória nesta fase; a camada Repository permite trocar por PostgreSQL sem mexer nas rotas.

## Plano B (se a internet ou a Vercel falhar)

1. **Vídeo gravado (recomendado):** gravar antes, em tela cheia, o fluxo completo do quadro acima (≈2 min da parte "Solução") e deixar o arquivo no desktop, fora do navegador. Tocar o vídeo e narrar por cima.
2. **Execução local (sem internet, exceto o mapa):**
   ```bash
   npm install
   python -m venv .venv && .venv\Scripts\python -m pip install -r requirements-dev.txt
   npm run dev          # http://localhost:3000
   ```
   Sem internet os **tiles do mapa não carregam**: a Prevora mostra o aviso e a **visão em lista** (mesmas informações). Isso também é um bom exemplo de resiliência para citar.
3. **Último recurso:** slides do pitch (`output/Prevora_Pitch_Final.pdf`).

## Contas de demonstração

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@londrinalimpa.example` | `Limpa-Admin-2026` |
| Gestor (CMTU/CTD) | `gestor@londrinalimpa.example` | `Limpa-Gestor-2026` |
| Técnico de campo | `tecnico@londrinalimpa.example` | `Limpa-Tecnico-2026` |
| Defesa Civil | `defesa@londrinalimpa.example` | `Limpa-Defesa-2026` |

O Administrador também vê **Saúde do sistema** (`/saude`): versão, uptime, modo do LLM (fallback) e últimos erros.
