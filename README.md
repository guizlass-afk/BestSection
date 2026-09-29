# BestSection

Aplicação web para otimizar o seccionamento de chapas em peças retangulares usando exclusivamente cortes guilhotinados. Foi pensada para seccionadoras e serras circulares de mesa: cada corte atravessa por completo o retângulo que está sendo dividido.

Todo o processamento, inclusive leitura e geração das planilhas, ocorre no navegador. Nenhum dado do projeto é enviado para um servidor.

## Recursos

- peças retangulares com identificação, comprimento, largura e quantidade;
- estoque misto com várias medidas e quantidades de chapas;
- opção de priorizar tamanhos específicos de chapa;
- largura da serra (*kerf*) e margem nas bordas configuráveis;
- rotação de 90° opcional para respeitar veio, estampa ou acabamento;
- algoritmo multi-início com diferentes ordenações, escolhas de estoque e divisões guilhotinadas;
- mapa visual por chapa, com peças e ordem dos cortes;
- sequência de cortes executável e lista completa de posições;
- modelo Excel, importação, salvamento do formulário e exportação do resultado;
- impressão do plano e barra de progresso durante a otimização.

## Como usar

1. Cadastre o nome do projeto, material e espessura.
2. Informe todos os tamanhos de chapa disponíveis. Marque **Priorizar** quando quiser consumir primeiro um tamanho específico.
3. Informe a largura consumida pela serra e, se necessário, a margem a remover das bordas.
4. Cadastre as peças em comprimento × largura × quantidade.
5. Defina se as peças podem girar 90°.
6. Clique em **Otimizar seccionamento**.
7. Confira os mapas, siga a sequência numerada de cortes e exporte o plano para Excel.

## Planilha de projeto

O modelo possui quatro abas:

- `Chapas`: identificação, comprimento, largura, quantidade e prioridade;
- `Pecas`: identificação, comprimento, largura, quantidade e observação;
- `Configuracoes`: projeto, material, espessura, largura de corte, margem e rotação;
- `Instrucoes`: orientação rápida de preenchimento.

Use **Salvar projeto preenchido** para baixar o estado atual do formulário e retomar o estudo mais tarde.

## Estratégia de otimização

O programa posiciona cada peça no canto de uma região livre. O posicionamento divide essa região por uma de duas sequências válidas:

1. corte vertical completo e depois corte horizontal no trecho separado; ou
2. corte horizontal completo e depois corte vertical no trecho separado.

As regiões restantes voltam ao conjunto de áreas disponíveis. O otimizador executa várias tentativas determinísticas variando ordem das peças, orientação, sentido da primeira divisão e seleção de chapas. As soluções são comparadas pelo número de peças atendidas, área bruta consumida, quantidade de chapas e qualidade das sobras.

Em listas grandes e estoques mistos, trata-se de uma heurística: ela busca um plano de excelente aproveitamento, mas não afirma ótimo matemático global para todo caso.

## Arquivos

- `index.html`: interface;
- `styles.css`: layout responsivo e visual de impressão;
- `app.js`: algoritmo, planilhas, visualização e exportação;
- `vendor/xlsx.full.min.js`: SheetJS Community Edition;
- `tests/browser-tests.html`: testes locais do algoritmo e da interface.

