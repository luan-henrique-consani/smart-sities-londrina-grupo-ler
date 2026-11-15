# PREVORA — Pitch cinematográfico
Nove slides, 16:9, referência de 1920 × 1080. Smart Cities Hackathon 2026.

## Abrir e apresentar
1. Extraia a pasta completa.
2. Abra **index.html** no Chrome, Edge ou outro navegador atual.
3. Use as setas para navegar. Clique à direita para avançar e à esquerda para voltar.
4. Pressione **F** para tela cheia. Se o navegador impedir, use F11.
Não é necessário instalar nada para apresentar. Fotografias, fontes e scripts estão locais. Não há CDN, analytics, chamadas a APIs ou necessidade de conexão.

## Atalhos
- Setas, espaço e Page Down: avançar; setas à esquerda e Page Up: voltar.
- Home e End: primeiro e último slide.
- F: tela cheia.
- N: roteiro, tempo sugerido e fontes do slide.
- P: imprimir os nove slides ou salvar como PDF.
- H: ocultar ou mostrar os controles.
- ?: ajuda.
- Escape: fechar roteiro ou ajuda.
Em telas de toque, deslize para os lados. A apresentação mantém 16:9 com barras de fundo quando necessário.

## PDF
Uma cópia pronta está em **exports/Prevora_Cinematico.pdf**.
Para exportar novamente após editar, pressione P ou clique em PDF, escolha “Salvar como PDF”, habilite gráficos de plano de fundo e desabilite cabeçalhos/rodapés. O CSS contém páginas 16:9 sem margens. A impressão do navegador pode depender das opções locais; o arquivo pronto foi exportado no Chrome com tamanho CSS preservado.

Exportação automatizada opcional, se tiver Node:
1. Execute `npm install`.
2. Use `npm run export:pdf`.
3. Se não houver navegador instalado reconhecido, execute uma vez `npx playwright install chromium` ou indique BROWSER_PATH.
Após obter a dependência e o navegador, a exportação funciona offline.
A apresentação principal continua sem dependências de instalação.

## HTML em arquivo único
A entrega também inclui **Prevora_Apresentacao.html**, com fontes, imagens, estilos e scripts incorporados. Basta abrir esse arquivo no navegador; ele funciona sem a pasta de assets. Para regenerá-lo após editar o projeto, execute `npm run bundle`. O destino padrão é a pasta exports.

## Servidor local opcional
Execute `npm start` para abrir em http://127.0.0.1:4173.
Esse comando usa apenas o Node, sem instalar pacotes.
Para outra porta, defina PORT antes de executar. Encerre com Ctrl+C.

## Editar
- **data/content.js**: títulos, textos, números, fotos, equipe, contato, roteiro, tempos e fontes.
- **scripts/deck.js**: nove funções de composição, SVGs e navegação.
- **styles/deck.css**: paleta, fontes, layouts e impressão.
- **assets/images/**: fotografias ilustrativas.
- **assets/fonts/**: fontes locais e licenças.
- **assets/brand/**: logo de referência e favicon.
- **assets/CREDITS.md** e **assets/assets.json**: autoria, licenças e URLs.
- **SOURCES.md**: metodologia e fontes dos dados.
- **ROTEIRO.md**: falas e janelas de tempo.
- **previews/**: capturas dos nove slides.
Para incluir fotos da equipe, coloque o arquivo em assets/images/ e preencha photo em copy.team.members. Ajuste os campos role, bio e contribution com dados reais. Preencha meta.contact com o canal escolhido pela equipe.

## Conteúdo e integridade
O protótipo é demonstrativo. Sensores e alertas operacionais são proposta de piloto. Não há promessa de previsão de enchentes, precisão, redução percentual de prejuízo ou economia demonstrada.

Os quatro retornos positivos são exploratórios, relatados pela equipe; não equivalem a compradores B2B ou testes de sensores. Fotos ilustrativas não representam o MVP, clientes, integrantes ou o episódio de Londrina. A foto da garagem alagada é de Miami Beach em 2016 e está identificada no slide.

TAM e SAM usam universos de referência, antes da qualificação. O SOM de cinco clientes é meta proposta em doze meses. Consulte SOURCES.md antes de alterar ou apresentar esses números.

## Referências de direção de arte
Black and White Modern Black Hole Presentation.pdf: dez páginas analisadas para composição, escala tipográfica, máscaras inclinadas, etiquetas e linhas finas. O conteúdo astronômico e as imagens da referência não foram reutilizados.
Oficina de Pitch_SCH26.pdf: ordem de nove slides. Os tempos são a distribuição operacional definida pela equipe.

A versão em HTML foi criada separadamente do protótipo operacional. Nenhuma funcionalidade desse protótipo foi alterada.


## Revisão da apresentação
O encerramento agora é um convite à colaboração. B2B e B2G aparecem no modelo comercial. A matriz usa P para planejado, D para demonstrado no protótipo e ? para capacidade não confirmada no concorrente; LLM e acionamento de bombas são propostas. A exportação inclui um fundo de capa opaco para evitar alterações de cor em leitores de PDF, preservando os textos vetoriais.
