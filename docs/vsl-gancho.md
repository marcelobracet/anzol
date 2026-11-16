# Gancho e primeiro quadro da VSL

Lição da Pequeños Exploradores (nov/2026): trocar só os primeiros 7 segundos do vídeo **triplicou a taxa de play** (6% → 16% de quem viu a página). Nenhum outro ajuste de página chegou perto disso.

## Por que o começo pesa tanto

A VSL abre **muda**. A pessoa decide ativar o som olhando só o **primeiro quadro**, antes de ouvir qualquer palavra. Depois que ativa, decide em **5 a 10 segundos** se continua. São duas decisões diferentes:

| Decisão | O que decide | O que mexer |
|---|---|---|
| Ativar o som | Primeiro quadro (imagem + texto na tela) | Texto grande no topo, rosto, cenário |
| Continuar assistindo | Primeira frase falada | Abrir pelo trecho mais forte do vídeo |

## Regras para todo vídeo novo

1. **Cold open (abrir pelo meio):** os primeiros 5–8 s são a frase de maior tensão do vídeo, tirada do meio dele. Ex.: *"te voy a mostrar el error más común… ese que muchas mamás cometen creyendo que están protegiendo a su hijo"*. Depois corta para o início normal.
2. **Texto no topo do primeiro quadro**, grande e curto, que gere curiosidade e seja verdade (o vídeo precisa entregar). Ex.: **"EL ERROR QUE MUCHAS MAMÁS COMETEN SIN SABERLO"** + linha menor "¿Tú también lo haces?". No topo para não brigar com o botão de som (centro) nem com as legendas (meio/baixo).
3. **Capa (poster) = primeiro quadro**, para não aparecer tela preta enquanto carrega.
4. **Corte limpo:** a frase não pode começar com conectivo ("También…", "Y…") nem ter sílaba repetida da edição original. Ouvir a prévia com som antes de subir.
5. **Medir por versão no Funil do Anzol:** comparar "Deram play" e "Metade saiu aos" da versão nova contra a anterior.

## Próximo gargalo a olhar

Depois do play, olhar **onde o botão aparece**. Na Pequeños o botão aparecia aos 8m10s e **0%** chegou lá; metade saía aos 10 s. Para produto de ticket baixo (US$ 9–15), o botão deve aparecer em 2–4 min, ou o vídeo deve ser mais curto.

## Como foi feito (ffmpeg)

- Recorte do trecho: `-ss <início> -to <fim>`, com fade de 30–40 ms no áudio para não estalar.
- Texto: `drawbox` (faixa preta 72%) + `drawtext` (Poppins Bold), só durante o cold open.
- Junção sem recodificar o resto: encodar o trecho com os mesmos parâmetros do original (H.264 High, 30 fps, AAC 48 kHz estéreo, mesmo timescale) e juntar com `-f concat -c copy`.
- Sílaba repetida: autocorrelação do espectro do áudio para achar o trecho duplicado e remover exatamente uma cópia.
