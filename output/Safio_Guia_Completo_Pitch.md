# Safio — guia completo de pitch, mercado e sensores
Versão de 14/11/2026. Nome provisório, sem referência geográfica na marca.

## 1. Escopo consolidado
A Safio propõe apoiar prefeituras e gestores de condomínios/comércios na priorização de inspeções e manutenção de drenagem e pontos delimitados de acúmulo de resíduos. Usa histórico, meteorologia e registros de intervenção. A evolução proposta inclui observações físicas por sensores, validadas por técnicos.

Confirmado pela equipe nesta conversa: foco B2G e B2B; primeiro público privado: condomínios e comércios; sensores ainda em proposta de implantação. O protótipo demonstra fluxos e dados de contexto, sem implantação IoT real, integração operacional confirmada ou validação de desempenho em campo.

O pedido anterior de manter IoT apenas visual no protótipo continua compatível: a apresentação explica o produto proposto, sem inventar telemetria ou alterar a aplicação. Nível de água elevado é sinal para investigar, sem provar entupimento. Descarte em terreno aberto exige abordagem diferente de nível em contêiner.

## 2. Respostas a todas as partes do PDF
O documento Oficina de Pitch_SCH26.pdf apresenta nove partes nas páginas 6 a 15, além dos tipos de pitch e orientações finais. A apresentação segue essa ordem. O material usa TAM, SAM e SOM; TOM não é adotado como substituto de SOM sem outra definição explícita.

### 2.1 Capa, identidade e mensagem inicial — página 7
**Nome de trabalho:** Safio. **Mensagem:** Monitoramento para orientar a manutenção preventiva.
**Frase de negócio:** A Safio ajuda gestores públicos e privados a decidir onde inspecionar e realizar manutenção primeiro, reunindo histórico, clima e, no piloto proposto, dados físicos de sensores.
A marca é provisória e não houve pesquisa de registro ou domínio.

### 2.2 Solução, proposta de valor e MVP — página 8
**Qual funcionalidade resolve o problema?** Mapa por ponto, histórico unificado, agrupamento de relatos do mesmo episódio, recomendação de prioridade com justificativa, registro de vistoria/intervenção e acompanhamento de reincidência. O módulo IoT proposto acrescenta estado de sensores e qualidade da leitura quando houver implantação autorizada.
**Como o cliente se beneficia?** Pode selecionar uma ordem de atendimento mais adequada ao risco, acompanhar se a ação ocorreu e avaliar se o problema reapareceu. Redução de custos, danos e reincidência são hipóteses para o piloto.
**Funcionalidades principais:** cadastro geográfico, integração autorizada/importação de dados, avaliação de risco com explicação, fluxo de decisão técnica e indicadores operacionais. Sensores são uma fonte adicional prevista, não um requisito para a demo.
**Quais elementos diferenciam?** Integração ao fluxo local, possibilidade de operar com histórico e acrescentar sensores por ponto, transparência sobre dados ausentes e medição do resultado após a intervenção. São apostas de diferenciação. Concorrentes já anunciam clima, sensores, priorização e histórico.
**Escopo do primeiro piloto:** 3 a 5 pontos, após avaliação técnica e autorização, incluindo um parceiro público e uma unidade privada se houver acesso. O conjunto de sensores depende do problema físico.
**O que permanece fora do MVP atual:** leituras inventadas, previsão de precisão comprovada, sensores anunciados como instalados, execução autônoma de equipes e promessa de evitar enchentes.

### 2.3 Problema, história e persona — página 9
**Problema escolhido:** o responsável precisa conciliar demanda, reincidência e risco de chuva com recursos de inspeção e manutenção limitados. A hipótese local a validar é que informações incompletas e dispersas dificultam essa decisão. Não afirmar que a Prefeitura deixa de priorizar: a CMTU já divulgou um método preventivo. [S04]
**Evidência concreta:** no Novo Amparo, em fevereiro de 2026, ao menos seis casas foram atingidas e uma família relatou perder uma máquina ainda parcelada. A Defesa Civil afirmou que obstruções agravaram o evento. [S02] Na Duque de Caxias, a reportagem atribuiu à CMTU a identificação de detritos e galerias insuficientes como fatores de alagamentos com prejuízo a lojas. [S03]
**Persona B2G:** gestor de limpeza/drenagem que decide prioridades e precisa justificar a alocação de equipes. Usuários incluem técnicos de campo. O comprador público deve ser identificado no piloto.
**Persona B2B:** síndico, administradora ou gestor de facilities com estrutura de drenagem e/ou ponto de resíduos monitorável. Sua dor de compra, orçamento e disponibilidade para pagar ainda não foram validados.
**Causas:** resíduos, solo e vegetação na drenagem; infraestrutura insuficiente ou danificada; chuva intensa; recorrência do descarte; restrições operacionais. Não reduzir todas as causas a falta de limpeza.
**Consequências:** perda de bens, interrupção do trabalho, retrabalho e resposta emergencial. Não há quantificação recente de desembolso familiar comprovado nos casos usados.
**Pergunta para abrir a história:** Como decidir o que precisa de manutenção antes da próxima chuva, quando a equipe não consegue visitar todos os pontos ao mesmo tempo?
A pergunta funciona como recurso do apresentador, sem transformar uma hipótese de operação em diagnóstico confirmado.

### 2.4 Validação — página 10
**Que dados validam aderência?** A equipe informou quatro retornos positivos sobre a proposta, com destaque para a priorização. É uma validação qualitativa exploratória. As fontes documentais comprovam a existência de problemas físicos, mas não validam automaticamente a compra da Safio.
**Feedbacks de funcionalidade:** interesse pela priorização, conforme relato da equipe.
**Usabilidade e design:** não foram informadas notas, tarefas observadas, tempo de execução ou dificuldades específicas. Não inventar esses resultados.
**Desempenho:** não há métricas operacionais, ensaios físicos ou acurácia demonstrada dos sensores.
**Ajustes identificados:** foco inicial no tomador de decisão; B2G e B2B; monitoramento físico como próxima implantação; visibilidade sobre a qualidade dos dados; recomendações confirmadas pelo técnico; piloto pequeno.
**O que não se pode dizer:** “100% do mercado aprovou”, “quatro servidores da CMTU validaram”, “já economizamos” ou “há clientes pagantes”.
**Próxima validação:** entrevistas com o comprador e o operador dos dois segmentos; execução de tarefa com protótipo; teste em bancada; comparação de leitura e vistoria; teste de disposição a pagar após definir a oferta.

### 2.5 Modelo de negócio — página 11
**Como e com quem ganhar dinheiro?**
1. Assinatura da plataforma, por organização/unidade e escopo de pontos.
2. Implantação, equipamentos e integração, por projeto.
3. Serviço de manutenção, inspeção e suporte, conforme contrato.
Manter no máximo essas três fontes no pitch.
**B2G:** Prefeitura ou órgão comprador definido pelo processo de contratação, com CMTU/Defesa Civil como áreas usuárias e CTD como possível interlocutora tecnológica. Não somar esses órgãos como quatro compradores independentes do mesmo contrato.
**B2B:** condomínio, empreendimento comercial ou administradora comprando para unidades identificadas. Evitar contar uma administradora e seus condomínios duas vezes.
**Canal B2G:** demonstração técnica, diagnóstico e piloto autorizado, seguido da forma de contratação aplicável. Não há venda garantida nem dispensa presumida de licitação.
**Canal B2B:** administradoras, síndicos, gestores de facilities e prestadoras como parceiros de implantação. Sem parceria comercial confirmada.
**Preços:** pendentes. As faixas de componentes recebidas não são preço de venda da plataforma.

### 2.6 Tamanho de mercado — página 12
TAM = universo amplo que pode usar a oferta; SAM = parcela que conseguimos atender no recorte inicial; SOM = parte que pretendemos conquistar com capacidade e prazo definidos. Não confundir organizações, moradores, apartamentos ou sensores.

| Medida | B2G | B2B |
|---|---|---|
| TAM de referência | 5.569 municípios brasileiros [S06] | Aproximadamente 327 mil condomínios do recorte do Censo 2025/26 [S07] |
| SAM proposto | 7 municípios selecionados no Norte do Paraná | 200 unidades estimadas como elegíveis em Londrina |
| SOM proposto, 24 meses | 1 organização pública | 10 unidades privadas |

**Contas e premissas:**
- SAM B2G: Londrina, Cambé, Ibiporã, Rolândia, Arapongas, Apucarana e Maringá. É cobertura comercial proposta, não lista de clientes, elegibilidade confirmada ou capacidade instalada.
- Universo local B2B: cerca de 2.000 condomínios, estimativa municipal publicada em março de 2026. [S08]
- Elegibilidade B2B hipotética: 10% com risco relevante, estrutura monitorável, responsável e condições de instalação.
- SAM B2B = 2.000 × 10% = **200**. O percentual precisa de levantamento de campo.
- SOM B2B = 10/200 = **5% do SAM estimado**, ou 0,5% do universo local.
- SOM B2G = 1/7 = **14,3% da cobertura proposta**. Meta de validação/comercial, não previsão de aquisição pública.
- Os 399 municípios do Paraná são referência de expansão, não o SAM inicial.
- A ABRASCE informa 658 shoppings no Brasil e 44 no Paraná. [S09] É segmento adjacente; não somar automaticamente ao total de condomínios, pois há estruturas de administração e cadastros que podem se sobrepor.
- O universo privado não estima todo comércio do Brasil. Esta é uma primeira conta pelo segmento com base disponível. O TAM combinado de todos os segmentos ainda não está consolidado.
- “327 mil” é referência retrospectiva do Censo 2025/26. Não utilizar resultados futuros/rascunhos da edição 2026/27 como se fossem dados já coletados. A contagem é cadastral e não um censo de edifícios.
- O IBGE distingue 5.569 municípios do Distrito Federal e do distrito de Fernando de Noronha. Eles foram excluídos desta conta de compradores municipais para não misturar competências.

**Como monetizar depois dos preços:** se Pg e Pb forem assinaturas mensais por organização pública e unidade privada:
- TAM anual de referência = 12 × (5.569 × Pg + 327.000 × Pb), sujeito a elegibilidade, escopo e ausência de dupla contagem.
- SAM anual do cenário = 12 × (7 × Pg + 200 × Pb).
- ARR na meta SOM = 12 × (1 × Pg + 10 × Pb).
Essas fórmulas não representam faturamento previsto. Implantação e venda avulsa de hardware ficam fora do ARR. Se a cobrança for por ponto, incluir pontos médios por contrato como outra premissa validada.

### 2.7 Diferencial e matriz comparativa — página 13
A comparação examina ofertas públicas declaradas pelos fornecedores, sem auditoria independente de desempenho ou confirmação de preços.

| Alternativa | O que já anuncia | Relação com a proposta |
|---|---|---|
| FILTROX / I-SENSE [S10] | Gestão de bueiros, clima, criticidade e histórico | Concorrente direto próximo; várias funções já existem |
| Inova Bueiros Inteligentes [S11] | Sensor de água/tampa e comunicação NB-IoT | Alternativa de monitoramento físico |
| Net Sensors do Brasil [S13] | Cesto coletor, sensor volumétrico e alertas | Alternativa combinando hardware e plataforma |
| Sensoneo [S12] | Preenchimento de contêineres, ciclos de coleta e rotas | Concorrente no monitoramento de resíduos delimitados |
| Londrina ON e rotina existente [S14] | Recepção, encaminhamento e acompanhamento de chamados | Potencial integração; também é alternativa já disponível ao gestor |

**O que podemos defender:** foco no fluxo escolhido pelo parceiro, integração de evidências ao trabalho existente, escolha do sensor adequada ao ponto e medição do resultado após a ação. Tudo precisa ser demonstrado no piloto.
**O que ainda não podemos defender:** menor preço, maior precisão, inexistência de concorrentes, patente, integração nativa pronta, funcionamento em qualquer cidade ou compatibilidade universal com sensores.
**Onde buscar vantagem real:** prazo de instalação, esforço de uso pelo técnico, taxa de alertas úteis, custo total de propriedade, qualidade da integração e facilidade de manutenção.
**Estratégia de entrada:** demonstrar um caso local estreito com parceiro acessível e resolver o fluxo de decisão ponta a ponta. O sensor genérico, sozinho, não constitui barreira competitiva.

### 2.8 Equipe — página 14
**Resposta honesta:** os nomes, experiências e responsabilidades de todos os integrantes não foram fornecidos. A apresentação reserva esta parte com funções necessárias, sem inventar currículos.
**Completar antes de apresentar:** nome; competência comprovável; responsabilidade; contato.
Funções a cobrir: produto/software; dados/integração; eletrônica/instrumentação; operação/comercial. Uma pessoa pode acumular funções. Não afirmar parceria formal com SENAI, CMTU, CTD ou Defesa Civil apenas pela participação no hackathon.

### 2.9 Roadmap, pedido e encerramento — página 15
**Até 30 dias, como proposta:** definir problema físico e locais, confirmar parceiro, obter autorização, selecionar modelo, testar em bancada e estimar custo total.
**Dias 31 a 60:** instalar mediante autorização, verificar comunicação/energia, acompanhar manutenção e comparar registros com vistorias. Sem instalação em campo sem consentimento e avaliação.
**Dias 61 a 90:** avaliar utilidade dos alertas, registrar decisões e custos, revisar montagem e critérios; expandir apenas se houver resultado e condições.
O cronograma depende de recursos, condições de campo, autorização e contratação.
**Pedido ao mentor/parceiro:** acesso autorizado a amostra anonimizada e histórico de intervenções, indicação de um responsável técnico e possibilidade de testar em poucos pontos.
**Encerramento sugerido:** Buscamos um parceiro público e uma administração condominial para validar um piloto de três a cinco pontos e medir se conseguimos orientar a manutenção no momento útil.
**Contato:** inserir canal da equipe antes da apresentação.

## 3. Incremento de hardware recebido da equipe
| Tecnologia | O que faz | Como entra no projeto |
|---|---|---|
| Indutivo de proximidade | Detecta alvo metálico | Tampa/peça metálica ou mecanismo projetado para o sensor; não detecta diretamente água ou lixo comum |
| Capacitivo | Detecta alteração de capacitância próxima à área sensível | Presença/nível em ponto definido, sujeito ao material, à montagem e à calibração |
| Boia | Muda de estado quando o líquido atinge determinado nível | Sinal de nível crítico, sem identificar a causa do acúmulo |

A boia não fornece uma curva contínua de profundidade por definição. Alguns modelos usam contato reed passivo. Sensores capacitivos e indutivos básicos normalmente precisam de alimentação e interface apropriadas, mas tensão e saída dependem do modelo. “10 a 30 V DC” é referência comum de alguns equipamentos, não uma regra para todos. Não ligar uma saída industrial diretamente a um microcontrolador sem compatibilidade prevista no projeto.

**Internet e energia:** detectar localmente não exige internet. Enviar informação à plataforma exige um nó de aquisição e uma rede adequada, que pode ter trechos sem internet pública. Wi-Fi, celular ou outra tecnologia dependem da cobertura e do consumo. Não escolher protocolo final antes do levantamento. O nó, a transmissão e a alimentação são custos adicionais.

**Manutenção:** ausência de contato mecânico não torna o sistema livre de manutenção. Prever limpeza, verificação do acionamento, inspeção de cabos/conectores, vedação, energia, comunicação e troca de componentes. Boias têm movimento físico e podem sofrer com resíduos. Frequência de manutenção só pode ser definida após ensaio e campo.

**Sensor capacitivo não é detector universal infalível:** distância, propriedades do material, umidade e sujeira alteram a leitura. Não mede automaticamente o volume de lixo em terreno aberto nem identifica o que foi descartado. Em contêiner, uma detecção pontual não equivale a porcentagem contínua de preenchimento.

**Fontes técnicas:** ifm [S15-S16] e WIKA [S17]. São referências de princípio; o modelo final ainda não foi selecionado.

### Faixas de preço informadas pela equipe
- Indutivo: R$ 25 a R$ 300+ por unidade.
- Capacitivo: R$ 60 a R$ 450+ por unidade.
- Boia: preço e modelo não informados.
Faixas recebidas do usuário, não verificadas como cotações. Não estimam instalação, proteção, impostos, comunicação, reposição ou margem.

**BOM a preencher:** sensor, nó de aquisição, condicionamento/isolação, alimentação e reserva, invólucro, fixação, comunicação, instalação, manutenção, plataforma e suporte. Custo do ponto instalado e custo de propriedade precisam separar investimento inicial e despesas recorrentes.

## 4. Simulação operacional e uso correto dos 180 dias
A Carta de Serviços informa até 180 dias para limpeza de bueiros e prevê prioridade de áreas de alagamento indicadas pela Defesa Civil. [S05] Confirmar sua aplicação atual com a CMTU. Esse prazo não é a espera média. Em outubro de 2025, a CMTU publicou capacidade média de seis pontos por dia e níveis de prioridade já existentes. [S04]

Exercício de reordenação: lote fictício de 60 pontos, com 12 pontos de maior risco inicialmente no final. Usar capacidade constante de 6/dia apenas como referência didática.
- Sem reordenação do lote fictício: 60/6 = 10 dias para concluir os 12 últimos.
- Com os 12 críticos primeiro: 12/6 = 2 dias para concluir esse grupo.
- Antecipação do fim do grupo crítico: 10 − 2 = **8 dias de trabalho**.
- Ambos os cenários mantêm 60 atendimentos e 10 dias no total. Outros pontos mudam de posição.
- O exercício não descreve a fila real, não prova prevenção de alagamento e não demonstra economia financeira.
- Previsão e sensores só geram valor se o alerta tiver utilidade e o operador tiver condições de agir.
Não apresentar uma suposta redução de 180 para 2 dias como resultado ou meta já comprovada.

O investimento de R$ 5,5 milhões no Água Fresca [S18] não é parcela demonstradamente evitável pela plataforma. Uma economia de R$ 87,5 mil discutida anteriormente veio de hipóteses escolhidas para uma simulação. Ela não foi usada como promessa comercial ou resultado da Safio.

## 5. Plano de validação e indicadores
- Medir concordância entre alerta e vistoria, incluindo falso positivo, falso negativo e ausência de leitura.
- Medir tempo do alerta à decisão, à vistoria e à execução.
- Registrar disponibilidade do conjunto, falhas, limpeza necessária e duração da energia.
- Acompanhar reincidência por ponto, intensidade de chuva e mudanças de infraestrutura.
- Comparar custo total, deslocamentos e retornos extras a uma linha de base.
- Avaliar clareza da recomendação e esforço adicional exigido do operador.
- Confirmar comprador, responsável pelo orçamento e disposição a pagar.
Não definir acurácia, antecedência de previsão ou economia garantida antes do teste. Comparação antes/depois precisa considerar chuva, obras e mudanças da operação.

**Dados necessários:** ponto e coordenadas; categoria; abertura do chamado; vistoria; execução real; encerramento; tipo e volume de material quando medido; dispositivo; chuva; estado do sensor; qualidade/ausência da leitura; decisão e motivo. Não usar relato duplicado como novo episódio. Distinguir chamado encerrado de serviço executado e verificado.

**Uso de IA:** pode apoiar organização e resumo das evidências. Qualidade do dado não deve virar nota de reputação do cidadão, nem ausência de foto eliminar um pedido. Recomendação precisa de justificativa auditável e avaliação humana.

## 6. Canvas de negócio atualizado
| Bloco | Conteúdo |
|---|---|
| Segmentos | B2G: organizações municipais; B2B: condomínios e comércios elegíveis |
| Proposta de valor | Evidências para priorizar manutenção e acompanhar o efeito das ações |
| Canais | Piloto técnico, demonstração, administradoras e prestadoras parceiras a prospectar |
| Relacionamento | Diagnóstico, implantação assistida, treinamento e revisão de indicadores |
| Receitas | Assinatura; implantação/equipamentos; manutenção/suporte |
| Recursos | Software, dados autorizados, instrumentação e equipe técnica |
| Atividades | Padronizar dados, testar sensores, operar integração e avaliar resultados |
| Parceiros | Órgãos locais, administradoras, instaladores e fornecedores; sem parceria comercial confirmada |
| Custos | Desenvolvimento, hardware, instalação, rede, energia, manutenção e atendimento |

## 7. High-concept, elevator pitch e roteiro
### Uma frase
A Safio reúne histórico, clima e monitoramento físico proposto para ajudar gestores públicos e privados a decidir onde realizar manutenção primeiro.

### Elevator pitch, 30 a 60 segundos
A Safio ajuda prefeituras, condomínios e comércios a priorizar inspeções e manutenção. O protótipo reúne histórico dos pontos, clima e registro de intervenções. A próxima etapa é testar sensores que acrescentem uma observação física, como água atingindo um limite, sem confundir isso com prova de entupimento. O gestor recebe uma recomendação explicada e decide a ação. Já tivemos quatro retornos positivos sobre a proposta, especialmente sobre priorização. Buscamos um parceiro para um piloto pequeno e medir utilidade, manutenção e resultado antes de expandir.

### Roteiro principal de aproximadamente 3 minutos
As notas dos slides 1 a 9 contêm o roteiro completo. Distribuição sugerida: 10 s, 30 s, 25 s, 18 s, 15 s, 22 s, 20 s, 10 s e 30 s. Total: 180 s. Ensaiar o tempo real com a equipe e reservar margem. A duração depende do ritmo de fala.

### Alternativa de aproximadamente 2 minutos
A Safio ajuda gestores públicos e privados a decidir onde inspecionar e realizar manutenção primeiro.

O protótipo reúne mapa, histórico, clima e intervenções. A próxima etapa será testar sensores em pontos autorizados para acrescentar observações físicas. A boia indica que a água atingiu um limite. A escolha do capacitivo depende da estrutura, e o indutivo atende alvos metálicos. O técnico avalia a recomendação.

A dor aparece em Londrina: há casos documentados de obstruções que agravaram alagamentos e perdas materiais. A oportunidade é melhorar a decisão sobre onde agir e acompanhar o efeito da intervenção.

A equipe recebeu quatro retornos positivos, sobretudo sobre priorização. Ainda não validamos sensores em campo nem a compra pelo mercado privado.

Nosso modelo é B2G e B2B, com assinatura, implantação e manutenção. O universo é de milhares de municípios e cerca de 327 mil condomínios, mas o foco inicial é regional. A meta proposta em 24 meses é uma organização pública e dez unidades privadas.

Existem concorrentes próximos, como FILTROX, Inova e Sensoneo. Vamos testar nossa diferenciação na integração local, no uso pelo técnico e no custo total do piloto.

A equipe deve apresentar seus integrantes e responsabilidades reais. Buscamos um parceiro público e uma administração condominial para testar três a cinco pontos, comparar alertas com vistorias e medir se a manutenção consegue acontecer no momento útil.

## 8. Respostas rápidas para a banca
**Isso já existe?** Sim. A proposta precisa demonstrar valor no recorte escolhido, na integração e no piloto.
**Os sensores funcionam hoje?** Ainda não foram implantados; o estágio confirmado é proposta de implantação.
**Como prevê sem histórico suficiente?** Inicialmente usar regras e alertas explicáveis. Modelos de previsão dependem de dados e avaliação adequada.
**Boia prevê enchente?** Ela informa um estado físico de nível. O contexto de risco vem do cruzamento de informações e da análise técnica.
**O indutivo detecta lixo?** Detecta metal próximo ao alvo. Não mede lixo misturado ou nível de água diretamente.
**E se ficar sem rede?** A arquitetura precisa prever ausência de dados e comportamento local adequado. Ainda será testada.
**A API do Londrina ON está disponível?** Não há acesso/documentação de integração confirmado nesta equipe. Importação autorizada é uma opção de piloto.
**Quem instala e mantém?** Responsabilidades precisam ser definidas com o contratante e profissionais adequados.
**Qual a economia?** Ainda não medida. O piloto deverá comparar custo total e mudanças na operação.
**Qual o valor?** A equipe ainda vai definir os preços. Os valores de sensores informados são componentes do custo.
**Vocês resolvem falta de capacidade das galerias?** O sistema pode apoiar a identificação e encaminhamento, mas obras continuam necessárias quando houver deficiência estrutural.
**O cidadão é usuário inicial?** Não. O uso inicial é pelos responsáveis públicos e privados; moradores e comerciantes são beneficiários indiretos.

## 9. Pendências que não devem virar afirmações no pitch
Nomes/funções da equipe e contato; marca definitiva; preços de venda; cotação e modelos de hardware; parceiro do piloto; acesso a dados; integração; orçamento; linha de base; taxa de acerto; manutenção; autorização e forma de contratação.
O estudo de mercado estima universo e cenários. Não equivale a receita contratada.

## 10. Fontes e rastreabilidade
Fontes consultadas em 14/11/2026. Os sites dos fornecedores descrevem sua oferta, sem comprovar automaticamente desempenho.

- **S01 — Oficina de Pitch_SCH26.pdf, 17 páginas, documento fornecido pela equipe**: https://chatgpt.com/library?file_id=libfile_863c25652e20819192c380573e96a04e&account_id=personal
- **S02 — Folha de Londrina, Novo Amparo, 27/02/2026**: https://www.folhadelondrina.com.br/cidades/chuva-inunda-casas-e-familias-perdem-tudo-no-novo-amparo-3291794e.html
- **S03 — Tarobá, Duque de Caxias, 03/02/2026**: https://taroba.com.br/tv/londrina/primeira-hora/bueiros-entupidos-causam-alagamentos-e-prejuizos-a-comerciantes-no-centro-de-londrina
- **S04 — Prefeitura, metodologia da CMTU, 20/10/2025**: https://blog.londrina.pr.gov.br/?p=201494
- **S05 — Carta de Serviços, limpeza de bueiros, consulta 14/11/2026**: https://servicos.londrina.pr.gov.br/Servico/Details/754?banner=true
- **S06 — IBGE, novo município e 5.569 municípios, referência 2025**: https://educa.ibge.gov.br/criancas/voce-sabia/22741-novo-municipio.html
- **S07 — uCondo, referência ao Censo 2025/26, aproximadamente 327 mil condomínios**: https://www.ucondo.com.br/censo-condominial/censo-condominial--2027
- **S08 — Prefeitura, aproximadamente 2 mil condomínios em Londrina, 04/03/2026**: https://blog.londrina.pr.gov.br/?p=208074
- **S09 — ABRASCE, Censo 2025/2026, 658 shoppings no país e 44 no Paraná**: https://abrasce.com.br/numeros/estados/
- **S10 — FILTROX, I-SENSE, oferta declarada pelo fabricante**: https://filtroxbueiros.com.br/isense
- **S11 — Inova Bueiros Inteligentes, oferta declarada pelo fabricante**: https://www.inovabueiros.com.br/
- **S12 — Sensoneo, monitoramento de preenchimento e gestão de coleta**: https://www.sensoneo.com/waste-fill-level/
- **S13 — Net Sensors do Brasil, descrição do aplicativo Bueiros Inteligentes**: https://play.google.com/store/apps/details?hl=pt&id=br.com.nsdobrasil.bueirosinteligentes
- **S14 — Prefeitura, Londrina ON e gestão de dados, 25/09/2026**: https://blog.londrina.pr.gov.br/?p=243541
- **S15 — ifm, sensores capacitivos e distinção em relação aos indutivos**: https://www.ifm.com/br/pt/category/200_010_030
- **S16 — ifm, sensores de nível, detecção pontual e medição contínua**: https://www.ifm.com/br/pt/shared/produtos/level/sensores-de-nivel
- **S17 — WIKA, boia FLS e contatos reed**: https://www.wika.com/en-en/fls.WIKA
- **S18 — Governo do Paraná, Água Fresca, investimento de R$ 5,5 milhões, 04/05/2026**: https://www.parana.pr.gov.br/aen/Noticia/Estado-destina-R-55-milhoes-do-Fecap-para-obra-de-prevencao-inundacoes-em-Londrina

## 11. Mapa de cobertura do PDF
| Página | Item atendido neste guia | Slide |
|---|---|---|
| 4 | High-concept, elevator e pitch deck | Guia 7 e notas |
| 6–7 | Capa, nome e mensagem | 1 |
| 8 | Proposta de valor, funcionalidades, benefícios e MVP | 2 |
| 9 | Problema e persona | 3 |
| 10 | Validação e ajustes | 4 |
| 11 | Modelo e até três receitas | 5 |
| 12 | Tamanho de mercado, TAM, SAM e SOM | 6 e anexo 10 |
| 13 | Matriz comparativa e diferenciação | 7 e anexo 11 |
| 14 | Equipe, responsabilidades e lacunas | 8 |
| 15 | Roadmap, pedido e contato | 9 |
| 16–17 | Referências, foco, fatos e limites | Todo o material |

Os slides 10 a 16 são anexos para perguntas e preparação. A apresentação principal termina no slide 9. Não é necessário projetar todos os anexos no pitch de três minutos.

