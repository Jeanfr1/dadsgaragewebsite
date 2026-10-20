# Prompts para continuar o projeto

## Prompt mestre

Continue o projeto Dad’s Garage usando os arquivos deste kit como fonte. O cliente aprovou explicitamente HERO DO MODELO 2 REVISADO + TODAS AS SEÇÕES DO MODELO 3 REVISADO. As referências aprovadas são as de bordô, tan e carvão em `references/`. Não usar os antigos estudos dourados.

Preserve o hero com a Hornet preta vista por trás em três quartos, grande roda traseira à esquerda, oficina de concreto com luz natural e logo na parede. Use `hero-rear.webp` no desktop e `hero-rear-mobile.webp` no mobile. Não substituir por moto frontal, Royal Enfield, custom dourada ou catálogo fictício. Cabeçalho e headline THIS IS / DAD’S GARAGE. vêm do modelo 2.

Todo o conteúdo abaixo do hero vem do modelo 3, na ordem: faixa carvão MAINTAIN. / RESTORE. CUSTOMISE.; motor fotográfico em largura total; navegação dos serviços; seção tan THE GARAGE IS THE PEOPLE. com logo grande discreta; mãos monocromáticas com bloco bordô LET’S TALK BIKES.; rodapé carvão com logo central. Não importar o corpo do modelo 2 (IN THE WORKSHOP, tabela ou YOUR BIKE. YOUR WAY.).

Mantenha as cores e os assets deste kit. Site em inglês britânico. Não invente equipe, fotos documentais, estoque, preços, depoimentos, avaliações, garantias ou horários. Dados de contato têm fonte em `fontes-e-assets.md`. As imagens de campanha são ilustrativas, não prova do imóvel ou da disponibilidade da moto.

Implemente movimento pela rolagem com progressão contínua e sem capturar a rolagem do usuário: entrada por máscara do título, câmera fotográfica avançando para a região do motor, passagem da faixa de serviços e continuação para a foto do motor, logo discretamente acompanhando a seção tan, parallax da foto de mãos. Preserve o conteúdo em movimento reduzido e mobile. Não anuncie um giro 3D se não houver modelo 3D ou sequência de vistas reais.

O projeto entregue é estático e funciona sem dependências externas. Consulte o JavaScript e o storyboard antes de substituí-los. Os botões de contato devem levar ao telefone/direções reais; não simular um agendamento confirmado. Ao finalizar mudanças, conferir visualmente em navegador desktop e mobile, testar teclado, pausa, menus e diálogos, além de checar assets e ordem das seções. Preservar a combinação aprovada acima de qualquer preferência estética própria.

## Prompt para polir o movimento

Sem alterar hero, imagens, paleta nem ordem das seções, refine a coreografia implementada em `site/app.js` e os ritmos de `animation/storyboard.md`. A foto do hero mantém a traseira da Hornet durante todo o trecho; a câmera aproxima a região do motor, a headline sai antes de cobrir o assunto e a faixa MAINTAIN entra em continuidade. Não adicionar efeitos luminosos, fumaça ou rotação de rodas estacionadas. Não trocar conteúdo para conseguir uma transição mais fácil. Testar a volta da rolagem, redimensionamento, ancoragem, abertura dos diálogos e movimento reduzido.

## Prompt para revisão de fidelidade

Compare a implementação com as duas referências aprovadas: hero 2 apenas no primeiro bloco; corpo e rodapé 3 em todos os blocos restantes. Liste diferenças observadas por seção e corrija somente as que contrariem a decisão. Não revisar usando imagens antigas ou números de modelo sem o sufixo REVISADO. Confirme que não apareceu nenhuma seção do corpo 2. Avalie o contraste dos títulos bordô, corte das rodas no mobile e proporção da logo. Relate o que foi realmente testado; não declarar browser QA com base apenas em verificações de código.
