# FORJA 3.0 — direção visual "forja incandescente"

## Referências e o que foi aproveitado
- **Spell UI (Animated Gradient):** a ideia de um fundo em redemoinho de cor feito em shader. O código oficial não foi copiado: `js/gradient.js` é uma implementação própria (WebGL 1, um fragment shader com ruído fractal deformado e rotação em espiral), sem dependências.
- **GetLayers:** visual escuro e cinematográfico, fundos de shader e cards guiados por imagem em fileiras horizontais. Aproveitado no fundo e no trilho "Divisão semanal" (cards com letra gigante e rank).
- **Refero:** biblioteca de telas reais de produtos. A galeria não pôde ser aberta nesta sessão; só o princípio (hierarquia densa e legível, como em produto real) foi usado. Não há cópia de nenhuma tela.

## O que mudou
- **Fundo:** gradiente WebGL grafite → verde profundo, com a cor de destaque deslizando para o rank (C amarelo, B azul, A verde, S roxo, SSS arco-íris).
- **Painéis:** raio maior, aresta de luz no topo, sombra funda. Hero com borda luminosa e brilho que respira. Botão principal com reflexo ocasional.
- **Navegação:** pílula flutuante de vidro com indicador deslizante.
- **Hoje:** trilho horizontal com snap; cada treino é um card com letra do dia, título, último rank e data.
- **Tipografia:** títulos maiores e mais firmes, números tabulares.

## Desempenho e acessibilidade
- Renderiza a ~30% da resolução, 30 fps, pausa com a aba oculta.
- Movimento reduzido (sistema ou app): um único quadro estático, já na cor do rank.
- Sem WebGL, contexto perdido ou aparelho modesto (≤ 2 GB ou ≤ 2 núcleos): continua o fundo CSS anterior.
- Vinheta mantém as bordas escuras para o texto continuar legível.
- Limitação: não foi medido em Android real (FPS/bateria).
