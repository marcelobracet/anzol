# Checklist: nova oferta no ar

Escrito depois do lançamento da Pequeños Exploradores (15/11/2026): a primeira venda não apareceu
nem no Anzol nem no Facebook por três falhas de configuração. Rode tudo antes de ligar os anúncios.

Legenda: **[1x]** = uma vez por conta/ambiente · **[oferta]** = repetir em toda oferta nova (inclui upsell/downsell).

## 1. Hotmart → Anzol (compras no funil)

- [ ] **[1x]** Webhook "Anzol · compras" ativo em Hotmart → Ferramentas → Webhook, versão 2.0.0,
      **todos os produtos**, eventos: compra aprovada, completa, cancelada, reembolsada e chargeback.
      URL: `https://<STUDIO_HOST>/api/webhooks/hotmart`.
- [ ] **[1x]** `HOTMART_HOTTOK` na Vercel (Production) = hottok de Hotmart → Webhook → Autenticação. Redeploy.
- [ ] **[1x]** Teste rápido: `POST /api/webhooks/hotmart` sem hottok precisa dar **401**.
      **500 = variável ausente** (o env é lido antes da autenticação).
- [ ] **[oferta]** No Studio → Ofertas: **ID do produto** Hotmart preenchido. É por ele que a compra acha o quiz
      (`quiz_for_product` olha só a versão **publicada**: publique depois de preencher).
- [ ] **[oferta]** Hotmart → Webhook → "Enviar teste" → Histórico mostra **200 - Processado**.

## 2. Hotmart → Facebook (compra na campanha)

O Anzol envia PageView, ViewContent, Lead e InitiateCheckout. **A compra (Purchase) acontece na Hotmart:
quem envia ao Meta é o Pixel do produto na Hotmart.** Sem ele, a campanha otimiza às cegas.

- [ ] **[oferta]** Hotmart → produto → Ferramentas → Pixel de rastreamento → Facebook:
  - ID do Pixel = o mesmo do Studio (Tema, navegação e Pixel).
  - Eventos: **só "Vendas realizadas"**. Não marque "Visitas na Página de pagamento": o Anzol já envia
    InitiateCheckout no clique e o Meta contaria em dobro.
  - Envio: **WEB + API de Conversão** (token do Gerenciador de Eventos → Pixel → Configurações → API de Conversões).
- [ ] **[1x]** `META_CAPI_TOKEN` na Vercel (o mesmo token). O Anzol manda os eventos dele também pelo servidor,
      com o mesmo `event_id` do navegador (deduplicação).
- [ ] **[oferta]** Campanha otimizando para **Compra** no mesmo pixel.

## 3. Página

- [ ] Janela anônima (o Anzol lembra o tempo assistido no localStorage; no seu navegador o CTA pode aparecer na hora).
- [ ] Vídeo inicia mudo; o botão de ativar o som está visível na 1ª tela do celular; capa do vídeo enviada.
- [ ] Com som, o CTA aparece no `showAt` (tempo mudo não conta) e abre o checkout com as UTMs da URL.
- [ ] PageSpeed (celular) sem alertas graves.

## 4. Dia 1 da campanha

- [ ] Gerenciador de Anúncios com o período em **Hoje** ou **Máximo** ("Últimos 30 dias" termina ontem e mostra zero).
- [ ] Após a 1ª venda: Gerenciador de Eventos → Purchase com origem **Navegador e Servidor**.
- [ ] Compras no funil do Anzol = vendas na Hotmart.

## Regras de análise

- Não decidir sobre criativos antes de 3 dias (aprendizado do pixel).
- Uma mudança por vez (página **ou** criativo), para saber o que moveu o resultado.
- "Deram play" no funil = **tocaram para ativar o som**; a retenção só conta a partir daí.
