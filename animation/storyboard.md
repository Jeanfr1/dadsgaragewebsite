# Storyboard — hero 2 + seções 3

## Dois formatos, funções diferentes

`site/app.js` implementa o movimento por rolagem da demonstração navegável. `motion-preview.mp4` é um animatic editado da sequência visual, com timings de apresentação; não é captura de tela nem filmagem real. O ritmo do site depende da rolagem do visitante, não dos segundos do vídeo.

| Trecho | Composição | Movimento / conexão |
| --- | --- | --- |
| Entrada | Hero 2; traseira da Hornet, roda esquerda, logo na parede | Foto assenta em cerca de 1,5 s. Headline entra por máscara em 1,1 s. Tagline aparece depois. Sem introdução bloqueante |
| Hero retido | Mesmo hero 2, sem trocar ângulo | Scroll 0–100% do runway. Escala 1→1,38 desktop / 1→1,20 mobile. Pan para o motor; foto permanece natural |
| Saída do hero | Título recua e some | Opacidade do título cai entre 18% e 73% do trecho; a faixa MAINTAIN sobe a partir da borda inferior |
| Serviços | Faixa carvão do modelo 3 | Revelação da palavra, bordô das ações e movimento horizontal máximo de 12px do subtítulo |
| Motor | Macro do modelo 3 | Entrada visual mantém direção de avanço; escala 1,08→1, deslocamento vertical contido. Sem linha dourada ou wireframe |
| História | Painel tan do modelo 3 | Ritmo mais calmo. Logo da direita varia de +5° a -3° e acompanha suavemente a rolagem; texto aparece uma vez |
| Mãos / contato | Foto P&B e bloco bordô do modelo 3 | Parallax vertical pequeno; bloco de contato revela de baixo para cima, sem tapar o assunto principal |
| Rodapé | Rodapé do modelo 3 | Estável, com navegação e endereço. A linha de progresso termina em tan |

## Regras de produção

- Não animar rodas girando numa moto apoiada no descanso.
- Não afirmar um orbit 3D: o código entregue anima enquadramentos fotográficos, não geometria da moto.
- Não mover o cursor do usuário, não capturar a roda de rolagem e não impedir links de âncora.
- Easing de máscara: cubic-bezier(.16,1,.3,1). Easing da progressão de câmera: smoothstep, com suavização de scroll em requestAnimationFrame.
- A suavização anima só enquanto há deslocamento; não mantém loop contínuo de renderização parado.
- No mobile, usar asset portrait, menor escala e menor retenção do hero.
- Em movimento reduzido, remover retenção longa, parallax e revelações; o conteúdo aparece integralmente.
- Botão de pausa acessível no cabeçalho; a preferência de sistema tem prioridade.

## Para uma futura filmagem / versão 3D

Uma filmagem real deve repetir a traseira em três quartos do hero 2 e chegar à posição equivalente do motor. Um orbit real exige material de captura ou modelo licenciado da moto. Esta melhoria não deve alterar o hero escolhido, a identidade ou a sequência das seções 3.
