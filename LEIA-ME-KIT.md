# Dad’s Garage — kit completo

## A combinação aprovada

**Hero do MODELO 2 REVISADO + todas as seções do MODELO 3 REVISADO.**

Os modelos aprovados são os de bordô, tan e carvão, apresentados depois da nova referência fotográfica. Os estudos anteriores em preto/dourado não fazem parte deste kit.

| Parte | Origem | O que preservar |
| --- | --- | --- |
| Cabeçalho e hero | Modelo 2 revisado | Hornet preta, ângulo traseiro em três quartos, roda traseira à esquerda, oficina com luz natural, logo na parede, “THIS IS / DAD’S GARAGE.” |
| Serviços | Modelo 3 revisado | “MAINTAIN. / RESTORE. CUSTOMISE.”, foto grande do motor e navegação de serviços abaixo |
| História | Modelo 3 revisado | Fundo tan, título bordô “THE GARAGE IS THE PEOPLE.” e logo grande com baixa opacidade |
| Contato | Modelo 3 revisado | Fotografia monocromática das mãos e bloco bordô “LET’S TALK BIKES.” |
| Rodapé | Modelo 3 revisado | Carvão, navegação, logo central e endereço |

## Abrir a demonstração

Abra `site/index.html` em um navegador atualizado. O site é estático, sem instalação, dependências externas, CDN ou build. Para um servidor local opcional, execute na pasta do kit:

```bash
python3 -m http.server 8080 --directory site
```

Então abra `http://localhost:8080`. Todo o conteúdo para visitantes está em inglês britânico. Os documentos de implementação estão em português.

## O que está incluído

- `site/`: HTML, CSS e JavaScript editáveis; imagens WebP, fontes locais e logo PNG transparente.
- `images-master/`: imagens PNG geradas em sua resolução nativa, incluindo hero desktop e mobile.
- `logo/`: reconstrução PNG com transparência da identidade existente.
- `references/`: os dois modelos aprovados, identificados pelo papel correto.
- `docs/GUIA-VISUAL.pdf`: composição aprovada, paleta, estrutura e mapa de movimento.
- `docs/roteiro-mestre.md`: ordem, enquadramento, conteúdo e critérios de fidelidade.
- `docs/prompts-implementacao.md`: instruções completas para continuar em outro editor ou agente.
- `docs/conteudo-en-GB.md`: textos do site, serviços e contato.
- `docs/fontes-e-assets.md`: informações verificadas e origem dos arquivos.
- `docs/validacao.md`: verificações realizadas e limites desta entrega.
- `animation/storyboard.md` e `animation/timeline.json`: roteiro e parâmetros do movimento.
- `animation/motion-preview.mp4`: animatic da direção de câmera e das conexões entre cenas.
- `animation/render_animatic.py`: reprodução do animatic com Python padrão + FFmpeg.

## Animação implementada

O hero permanece em cena durante a primeira parte da rolagem. O enquadramento traseiro aproxima-se da região do motor enquanto o título sai suavemente. A faixa tipográfica apresenta os serviços; o motor continua o movimento de câmera. Depois, o ritmo desacelera na seção tan, a logo acompanha discretamente a rolagem e a fotografia das mãos leva ao contato.

É uma animação fotográfica em camadas de página, com deslocamento, escala, revelação tipográfica e parallax. **Não é um modelo 3D da Hornet nem um giro real de câmera ao redor dela.** A moto estacionada permanece fisicamente coerente; não há rodas girando sobre o descanso. O MP4 é um animatic editado, não uma gravação do site nem um vídeo real da oficina.

O botão de pausa fica no cabeçalho. `prefers-reduced-motion` reduz o movimento automaticamente. O conteúdo permanece disponível sem JavaScript; as consultas podem ser feitas pelo telefone exibido no fallback.

## Contato e funções

“Book the workshop” abre as informações para ligar e combinar uma visita. Não simula um agendamento confirmado nem envia dados. Os links dos serviços abrem suas descrições. “Meet the garage” mostra a história e a fotografia original da fachada fornecida pelo usuário. “Motorcycles” leva ao Instagram da empresa; não há catálogo, preço ou estoque fictício.

## Imagens e logo

O hero, o detalhe do motor e as mãos são imagens ilustrativas geradas para este projeto. Não devem ser apresentados como fotografias documentais do imóvel, equipe ou estoque. O mural é uma aplicação conceitual da marca. A foto original da fachada, em `site/assets/original-garage-frontage.png`, é a imagem real fornecida na conversa e está identificada no diálogo da história.

A logo foi reconstruída a partir da imagem fornecida, com PNG realmente transparente. É uma aproximação limpa da identidade existente, não o arquivo-mestre original nem um SVG vetorizado. Substitua pelo original do proprietário se ele estiver disponível. O kit não inclui SVG com bitmap embutido anunciado como vetor.

## Publicação e revisão

Publique somente o conteúdo de `site/` em uma hospedagem estática. Preserve a pasta `assets/`. Não publique o restante do kit como páginas públicas.

O código JavaScript, os caminhos, a transparência e a ordem hero 2/seções 3 foram conferidos. A pré-visualização gerenciada estava indisponível; **não foi possível concluir a validação visual e interativa em navegador**. Antes de publicar, confira desktop, mobile, teclado, diálogos e rolagem conforme `docs/validacao.md`. Nenhuma publicação externa foi realizada nesta entrega.
