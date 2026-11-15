# LGPD na Prevora

> Princípio: **o sistema guarda o problema, não a pessoa.** Nenhum dado de cidadãos é coletado.

## Dados tratados

| Dado | Titular | Onde fica | Finalidade | Retenção |
| --- | --- | --- | --- | --- |
| Nome, e-mail, cargo | Servidor público com acesso | `data/users.json` (seed, só leitura) | Autenticar e aplicar o perfil (RBAC) | Enquanto houver vínculo com o sistema |
| Hash Argon2 da senha | Servidor | `data/users.json` | Autenticação | Idem |
| Aceite do termo (versão e data) | Servidor | JWT da sessão + store em memória | Prova do consentimento | Sessão (8 h) / até o cold start |
| Decisões registradas (perfil e id do autor) | Servidor | Store em memória | Rastreabilidade | Até o cold start (MVP) |
| Trilha de auditoria (ação, id do usuário, perfil, horário, request_id) | Servidor | Store em memória e log JSON | Segurança e prestação de contas | **6 meses** |
| Logs técnicos | Servidor | stdout (Vercel) | Operação e diagnóstico | **6 meses** |
| Ocorrências, pontos, chuva, alagamentos (simulados) | Nenhum (não identificam pessoas) | `data/*.json` | Análise preventiva | **5 anos** |

Fotos: o envio está fora do MVP. Quando existir, rostos e placas de veículos devem ser desfocados antes do envio.

## Base legal

- Execução de políticas públicas pela administração (LGPD, art. 7º, III) para os dados de acesso.
- Consentimento (art. 7º, I) para o tratamento do cadastro e da trilha de auditoria, registrado com **data e versão** (`CONSENT_VERSION` em `backend/core/config.py`). Mudou o termo, sobe a versão e todos aceitam de novo.

## Direitos do titular (tela "Meus dados")

- **Exportar** (`GET /api/privacy/my-data`): JSON com cadastro, consentimento, decisões, trilha de acesso e pedidos de exclusão. A exportação é auditada.
- **Excluir** (`DELETE /api/privacy/my-data`): registra o pedido (`DEL-xxxx`), remove do store em memória as decisões e o consentimento, revoga a sessão e a encerra.
  - **Limite do MVP:** o cadastro de origem está em `data/users.json` (somente leitura) e a trilha de auditoria segue a retenção de 6 meses (art. 16, I e II: cumprimento de obrigação legal e segurança). A remoção definitiva da conta é feita pelo encarregado, a partir do pedido registrado.
  - Por isso a conta demo ainda consegue entrar depois do pedido, o que mantém a demonstração de pé.

## Auditoria

Registramos `login`, `logout`, `consentimento_aceito`, `exportacao_dados_pessoais`, `pedido_exclusao_dados` e `consulta_trilha_auditoria`. A entrada guarda só o **id** do usuário (ex.: `U-01`) e o perfil, nunca nome nem e-mail. Consulta: `GET /api/admin/audit` (só Administrador) e tela "Saúde do sistema". Entradas com mais de 183 dias são descartadas.

## Mascaramento de logs

`backend/core/logging.py` mascara por chave (`email`, `nome`, `password`, `senha`, `token`, `authorization`, `api_key`, `jwt`…) e por padrão no texto (e-mails, JWT, `Bearer`, chaves `sk-…`, `senha=…`). Os testes em `tests/test_security_lgpd.py` provam que nenhum desses valores aparece em texto puro. Erros de validação nunca devolvem o valor recebido.

## Segurança relacionada

Argon2, JWT em cookie httpOnly/Secure/SameSite=Lax (8 h), logout que revoga o token, CSRF por cabeçalho customizado, CORS restrito, CSP/HSTS/X-Frame-Options/Referrer-Policy/Permissions-Policy, limite de 5 logins falhos por minuto por IP e RBAC em todas as rotas.

## Contato do encarregado (DPO)

**[A DEFINIR pela Prefeitura de Londrina]**
