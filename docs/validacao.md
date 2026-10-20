# Validação e limites

## Conferido nesta entrega

- Sintaxe de `site/app.js` com `node --check`.
- Caminhos dos assets locais, links de âncora e alvos dos diálogos a partir do HTML.
- Ordem estrutural: hero, serviços/motor, história tan, mãos/contato, rodapé.
- Hero usa `hero-rear.webp`, derivado do modelo 2 revisado; mobile preserva o ângulo traseiro.
- O corpo segue a estrutura do modelo 3, sem a tabela nem “YOUR BIKE. YOUR WAY.” do modelo 2.
- Arquivos JSON do kit e manifesto de assets.
- Logo PNG RGBA, com pixels transparentes reais; não é fundo quadriculado pintado.
- Imagens finais inspecionadas; referências aprovadas incluídas com nomes inequívocos.
- Guia PDF de cinco páginas renderizado e inspecionado visualmente.
- Animatic MP4 renderizado e frames dos quatro trechos inspecionados.
- Conteúdo do ZIP, integridade dos arquivos e manifesto SHA-256.

## Não concluído no ambiente

A pré-visualização gerenciada retornou `sites-previewd mailbox is unavailable`. Não havia supervisor de preview disponível. Não foi usado outro servidor ou navegador improvisado para declarar um teste visual inexistente. Consequentemente, **browser QA, desempenho real, responsividade visual e interações manuais não estão verificados**.

O código implementa responsividade, pausa, movimento reduzido, menu e diálogos; a presença dessas implementações não substitui testes em navegador. O site não foi publicado.

## Revisão em navegador antes da publicação

1. Abrir a versão desktop em 1440×900 e 1280×800: headline legível, duas rodas preservadas, hero traseiro correto.
2. Rolar para baixo e voltar: retenção do hero sem saltos, saída da headline, entrada da faixa MAINTAIN e motor sem bordas vazias.
3. Conferir a seção tan e a foto de mãos contra a referência de seções 3.
4. Abrir em 390×844 e 430×932: versão portrait do hero, menu sem sobreposição, títulos sem cortar letras, botões acessíveis e sem rolagem horizontal.
5. Abrir/fechar menu, cada diálogo de serviço, contato e história. Fechar com Escape e clicar fora. Conferir retorno do foco.
6. Navegar por teclado; testar link “Skip to the workshop” e foco visível.
7. Acionar pausa e retomada. Ativar movimento reduzido no sistema: conteúdo visível e ausência de parallax/retenção longa.
8. Confirmar telefone atual com a empresa e testar links tel, mapa e Instagram.
9. Confirmar que “Book the workshop” abre contato, sem alegar agendamento concluído.
10. Repetir no Safari/iOS e Chrome/Android. Confirmar carregamento de WebP e fontes locais e medir desempenho real se necessário.

## Distinções importantes

- MP4: animatic editado; não captura de navegação nem filmagem da empresa.
- Imagens principais: ilustrações fotográficas geradas; foto original apenas na história.
- Logo: reconstrução PNG da marca; não arquivo vetorial mestre.
- Movimento: câmera fotográfica e elementos de página; não orbit 3D de moto.
