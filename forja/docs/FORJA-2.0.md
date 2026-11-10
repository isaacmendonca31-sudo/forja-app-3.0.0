# FORJA 2.0 — avaliação do documento de design e o que foi feito

Origem: `FORJA_2_0_Design_Animacoes_Interacoes.md`. Cada ideia foi avaliada contra o que o app já é
(diário de treino offline, dados só no aparelho, CSP estrita, sem dependências).

## Implementado

| Ideia do documento | Como ficou | Onde |
|---|---|---|
| Três níveis de movimento (micro/UI/especial) | Tokens `--t-micro/--t-ui/--t-special` (160/300/900 ms; 200/380/1200 ms no modo Intenso). Só `transform`, `opacity` e `stroke-dashoffset` são animados. | `css/style.css` (bloco 2.0) |
| Preferências: intensidade de movimento, vibração, som, efeitos de rank, descanso automático | Ajustes → "Treino" e "Animações e feedback". Campos novos `motion`, `rankEffects`, `autoRest` em `settings` (backup antigo recebe os padrões). Switches acessíveis (`role="switch"`). | `validate.js`, `views/settings.js`, `feedback.js` |
| Tela de treino: cabeçalho compacto, tempo, "Série X de Y", próximo exercício | Barra fixa com série atual, cronômetro do treino e pausa. | `views/workout.js` |
| Pausar treino | `pausedMs`/`pausedAt` no rascunho. A duração salva **exclui** o tempo em pausa. Registrar uma série retoma sozinho. | `summary.js` (`elapsedMs`, `adjustedEnd`) |
| Estados dos cards (atual, concluído, pulado, trocado) | Atual com brilho verde, concluído recolhível (botão com `aria-expanded`), pulado esmaecido, trocado com etiqueta ("Substitui…" / "Trocado por…"). | `workout.js`, `validate.js` (`swapNote`) |
| Pulso ao concluir série | Anel de brilho curto no card (`pulse`), sem atrasar o registro. | `workout.js` |
| Timer circular com presets | Anel SVG (`stroke-dashoffset`), presets 1:00/1:30/2:00/3:00, ±15 s, pular; pulso ao terminar. Continua por timestamp (correto com a tela bloqueada). | `timer.js` |
| Apresentação cinematográfica do rank | Efeitos por rank: C brilho amarelo, B reflexo azul, A pulso verde, S roxo com partículas, SSS arco-íris com partículas (sem flashes). Toque no resumo pula tudo. | `workout.js` (`burst`), CSS |
| Tela de conclusão: entrada escalonada, comparação com o treino anterior | Blocos entram em sequência; barras "Anterior × Hoje" desenhadas progressivamente. | `workout.js` |
| Esforço percebido (RPE 1–10) | Opcional no resumo; salvo à parte (`updateSessionEffort`), aparece no histórico. Treinos de teste nunca recebem. | `store.js`, `history.js` |
| Gráficos com tooltip | Toque, mouse ou foco (teclado) num ponto mostra data e valor; a tabela alternativa continua. | `chart.js` |
| Navegação: indicador deslizante, rolagem preservada | Indicador por `transform`; abas principais lembram a rolagem; redesenho na mesma tela não volta ao topo. | `app.js` |
| Transição entre telas | `document.startViewTransition` (fade curto) só onde existe e com movimento permitido. | `app.js` |
| Dashboard: saudação e entrada escalonada | "Bom dia/Boa tarde/Boa noite" por horário (sem nome). Blocos entram em sequência (não no treino). | `today.js`, CSS |
| Abertura com bigorna e martelo | ≤ 1 s, uma vez por sessão, some sozinha por CSS (nunca bloqueia), toque pula, oculta com movimento reduzido. | `index.html`, `app.js`, CSS |
| Microinterações | Switches, foco de campos, botões de esforço, ícone do recolher. | CSS |
| Regras de desempenho | Só propriedades baratas; animações pausam com a aba oculta; aparelhos com ≤ 2 GB/≤ 2 núcleos trocam desfoque por painel sólido. | `feedback.js` (`applyMotionPrefs`) |

## Adaptado

- **Reduzir movimento:** o pedido do sistema (`prefers-reduced-motion`) sempre vence a preferência do app. "Reduzida" no app tem o mesmo efeito.
- **Som:** continua sendo só o bipe de fim de descanso (já existia); não há trilha sonora.
- **Tempo de treino:** o documento sugeria um cronômetro simples; foi feito com pausa e descontado da duração salva.

## Não implementado (e por quê)

- **Avatar/perfil e nome do usuário:** exigiria guardar dados pessoais novos; o app não tem conta obrigatória.
- **Temas extras:** dobra a manutenção de contraste/acessibilidade (já há suporte a alto contraste e transparência reduzida).
- **Tocar no card para detalhes, menu de contexto:** conflita com o toque de registro e com o uso com uma mão.
- **Transições horizontais entre páginas:** custo de desempenho em aparelhos modestos; o fade da View Transition cobre a necessidade.
- **Medição de bateria/FPS em aparelho real:** não foi possível aqui; as regras de desempenho são conservadoras, mas não foram medidas em hardware Android.

## Garantias mantidas

- Registrar e salvar uma série nunca espera animação (o treino é salvo antes do resumo aparecer).
- Nenhuma informação essencial depende de animação (rank, tempo e estado aparecem em texto).
- Dados locais, backup, offline e regras de segurança inalterados; os campos novos são opcionais.
- Modo de teste continua isolado: nada do 2.0 grava dados de teste nos dados reais.
