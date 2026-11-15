# Rastreamento x trackeamento e o envio server-side para a Meta

Anotações do curso (15/11/2026) conferidas na documentação oficial da Meta e da Hotmart.
**Status: só documentação. Nada disto foi implementado ainda além do que está em "O que o Anzol já faz".**

## Conceitos

| Termo | O que é | Para quem serve | Ferramenta |
|---|---|---|---|
| **Rastreamento** | Saber de onde veio cada venda (campanha, conjunto, anúncio) | Nós (decisão de verba) | UTMs + Utmify, `sck`/`src` da Hotmart |
| **Trackeamento** | Enviar os eventos certos, com os dados certos, para a Meta | O algoritmo (otimização) | Pixel + Conversions API (CAPI) |

- UTM = *Urchin Tracking Module*.
- Utmify mostrando mais vendas que o Gerenciador não é bug: é a Meta deixando de receber (ou de casar) parte das compras. Cada compra perdida é sinal a menos para o algoritmo. Os números nunca batem 100% (janelas de atribuição diferentes); o objetivo é encurtar a diferença.

## Por que o servidor

Dentro do Facebook/Instagram a Meta sabe quem é a pessoa. Ao clicar no anúncio ela sai para o nosso domínio e a Meta passa a depender do que a página e o servidor enviarem. Navegador sozinho perde eventos (bloqueador, iOS, rede); a Meta recomenda o **setup redundante**: o mesmo evento pelo Pixel e pela CAPI.

## O que a documentação da Meta confirma

- `client_ip_address`, `client_user_agent`, `fbp` e `fbc` vão **sem hash**. `client_user_agent` é **obrigatório** em eventos de website.
- `em`, `ph`, `fn`… vão normalizados e com **SHA-256**; `external_id` com hash recomendado. Normalizar e fazer hash **uma vez só** (no cliente ou no servidor).
- Não alterar os cookies `_fbc`/`_fbp`; `_fbc` diferencia maiúsculas.
- **Deduplicação**: Pixel e CAPI com o mesmo `event_name` e o mesmo `event_id` (o `eventID` do Pixel), no mesmo pixel, em até 48 h. Sem isso o evento conta duas vezes.

## O que a Hotmart confirma

- UTMs **não** chegam pelo webhook/API; a alternativa indicada é o parâmetro **`xcod`** no link do checkout. Ele é o **indexador** do diagrama do curso: liga a visita (dados de navegação) à compra (dados do comprador).
- `sck`/`src` preenchem a "Origem" no relatório de vendas da Hotmart.

## Fluxo-alvo (diagrama do curso)

```
Página (Anzol) ── fbp, fbc, IP, user_agent, xcod ──► Servidor (nosso)
                                                       │ guarda por xcod
Hotmart ── webhook: comprador (e-mail, telefone, nome) + xcod ──► Servidor
                                                       │ junta navegação + comprador
                                                       └──► Meta CAPI: Purchase
```

Não há seta Hotmart → Meta: a compra sai do **nosso** servidor, com os dados juntos.
O "S" do diagrama é o **Stape** (sGTM hospedado no próprio subdomínio). No nosso caso o próprio Anzol faz o papel do sGTM: já roda no servidor e já fala com a CAPI. Stape/sGTM no Hetzner só faz sentido se quisermos centralizar várias ferramentas num lugar só.

## Passo a passo do fluxo (e o erro que mais se comete)

1. **Lead entra no quiz/VSL** (Anzol). O navegador tem os cookies `_fbp` e `_fbc` (este só existe se veio de clique em anúncio, pelo `fbclid`).
2. **Clique no checkout = momento de guardar.** O Anzol grava no banco, pelo **indexador** (`xcod`): `fbp`, `fbc`, IP e user agent **da requisição do navegador do lead**, a URL da página e as UTMs. O mesmo `xcod` vai no link do checkout da Hotmart.
3. **Compra na Hotmart.** O comprador informa e-mail, telefone e nome no checkout.
4. **Webhook chega no nosso servidor** com os dados do comprador e o `xcod`.
5. **Junta e envia:** busca pelo `xcod` os dados de navegação **gravados no passo 2**, soma os dados do comprador (com hash) e envia o Purchase pela CAPI.

> ⚠️ **Erro clássico: usar IP e user agent da requisição do webhook.**
> Quem faz a requisição do webhook é o **servidor da Hotmart**, não o comprador. O IP e o user agent dessa chamada são de um datacenter da Hotmart. Mandar isso para a Meta é dizer que a compra foi feita por um servidor: a correspondência piora e o sinal fica errado.
> **Regra:** dados de navegação (`fbp`, `fbc`, IP, user agent, URL) vêm **sempre do banco**, gravados **antes**, quando o lead estava na página. Do webhook só se aproveitam os **dados do comprador** (e-mail, telefone, nome, país), o valor, a moeda, a transação e o `xcod`.

Outros cuidados do envio:
- `event_time` = horário da aprovação da compra (não o da chegada do webhook, que pode ser reenviado).
- `event_id` = código da transação Hotmart: reenvios do webhook não viram compras duplicadas.
- `action_source: "website"` e `event_source_url` = URL da página gravada no passo 2.
- Sem `xcod` ou sem registro no banco (ex.: compra por link direto): enviar só com os dados do comprador, sem inventar navegação.

## O que o Anzol já faz

- PageView, ViewContent, Lead e InitiateCheckout pelo Pixel **e** pela CAPI, com o mesmo `event_id` (dedup).
- CAPI com IP, user agent, `fbp`, `fbc` sem hash; e-mail, telefone, primeiro nome e país do lead com SHA-256.
- Repassa UTMs, `src` e `sck` da URL da página para o checkout.
- Purchase hoje: **Pixel + CAPI nativos da Hotmart** (configurados em 15/11/2026), sem os dados de navegação da visita.

## O que falta (plano, quando decidirmos implementar)

1. **Indexador**: gerar `xcod` por sessão no Anzol e anexar ao link do checkout (junto das UTMs).
2. **Guardar a navegação** por `xcod` no banco: `fbp`, `fbc`, IP, user agent, UTMs, `event_source_url`. Com retenção curta (ex.: 30 dias).
3. **Webhook → Purchase**: ao receber compra aprovada com `xcod`, buscar a navegação, montar o Purchase (`value`, `currency`, `event_id` = transação Hotmart) com e-mail/telefone/nome do comprador **com hash, sem gravar o dado aberto** (hoje o webhook ignora o e-mail por privacidade; passaria a lê-lo só para o hash) e enviar pela CAPI.
4. **Desligar o Purchase da Hotmart** no Pixel do produto quando o nosso estiver no ar. Os `event_id` são diferentes: os dois juntos contariam a compra em dobro.
5. Validar no Gerenciador de Eventos: qualidade de correspondência (EMQ) do Purchase e taxa de deduplicação.

## Referências

- Meta: Customer Information Parameters; Handling Duplicate Pixel and Conversions API Events; Conversions API Best Practices; Parameter Builder Library.
- Hotmart: "Como configuro os parâmetros UTM…" (seção sobre webhook/API e `xcod`); "Como identificar a origem das minhas vendas".
