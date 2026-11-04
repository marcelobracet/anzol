# Anzol

Plataforma interna para criar quizzes pré-VSL. Studio (privado) e Runtime (quizzes públicos) no mesmo app Next.js, separados por host em `src/proxy.ts`.

## Rodar local

```bash
nvm use            # Node 24 (.nvmrc)
npm install
cp .env.example .env.local   # preencha; AUTH_DEV_BYPASS_EMAIL libera o Studio em localhost
npm run dev
```

Com `STUDIO_HOST=localhost`, o Studio abre em http://localhost:3000. Domínios de oferta podem ser simulados com `*.localhost` (ex.: http://oferta.localhost:3000).

Banco: aplique `supabase/migrations/` no projeto Supabase, em ordem.

### Usar tudo sem banco

Em `npm run dev` sem `SUPABASE_URL`, quizzes, domínios, eventos e compras ficam em memória (somem ao reiniciar) e o cadastro na Vercel é simulado. Dá para criar no Studio, publicar, ligar `oferta.localhost` e abrir http://oferta.localhost:3000. Só vale em `next dev`.

### Ver o runtime sem banco

Em `npm run dev`, http://demo.localhost:3000 serve um quiz de demonstração e http://demo.localhost:3000/vsl uma VSL com timer (`src/features/runtime/demo-document.ts`). Só existe em `next dev`; em build de produção e previews esse host vai ao banco como qualquer outro.

## Studio

- `/quizzes/<id>`: editor em 3 colunas (steps com arrastar, preview no player real, propriedades/tema). Salva sozinho (debounce, lock otimista por `draft_revision`); rascunho inválido não é salvo.
- Publicar congela a revisão atual em `quiz_versions` (`publish_quiz()`, migration 0003) e invalida as tags do runtime.
- `/quizzes/<id>/settings`: dados, domínios (cadastro automático na Vercel via `VERCEL_API_TOKEN`), duplicar e arquivar.
- Upload: assinatura no servidor (`CLOUDINARY_API_KEY/SECRET`), envio direto do browser ao Cloudinary.

## Runtime

- Rota interna `/r/[host]/[[...slug]]`: raiz do domínio = `domains.default_quiz_id`; `/{slug}` = quiz ligado ao domínio em `quiz_domains`.
- Lê só a versão publicada (`published_quiz()` no Postgres), nunca o rascunho.
- Cache com `'use cache'` + tags `runtime:host:<host>` e `runtime:quiz:<id>`; publicar invalida as tags.
- Imagens via Cloudinary (`CLOUDINARY_CLOUD_NAME`); GIFs são entregues como mp4.
- VSL: HLS do Bunny Stream (`BUNNY_CDN_HOST`), hls.js carregado só quando precisa; barra 1-(1-x)^k; CTA aos `showAt` segundos assistidos (lembrado no localStorage).
- Checkout: promo enquanto `expiresAt` não passa, senão preço cheio. `utm_*`, `src` e `sck` da URL do quiz substituem os do link; nada mais é repassado.
- Toast de compras: `GET /api/t/purchases` (só no domínio da oferta) devolve primeiro nome, cidade e país de compras aprovadas reais.

## Verificação (tudo precisa estar verde)

| Comando | Verde quando |
|---|---|
| `npm test` | todos os testes passam |
| `npm run typecheck` | sem saída, exit 0 |
| `npm run lint` | sem erros |
| `npm run build` | build concluído sem erro |

## Roteamento

| Host | Comportamento |
|---|---|
| `STUDIO_HOST` | Studio; exige `Cf-Access-Jwt-Assertion` válido (team, AUD, RS256, e-mail na allowlist). `/api/webhooks/*` passa sem JWT (auth própria). |
| `BLOCKED_HOSTS` e subdomínios | 404 sempre |
| Qualquer outro | Runtime: reescrito para `/r/[host]/...`; Studio, webhooks e rotas internas dão 404 |

O bypass de auth (`AUTH_DEV_BYPASS_EMAIL`) só funciona em `next dev` e em previews da Vercel; produção ignora.

## Rastreamento

- `POST /api/t` (domínio da oferta): quiz_start, step_view, vsl_view, lead, checkout_click. Grava em `events` (único por `event_id`) e, para PageView, ViewContent, Lead e InitiateCheckout, chama a Conversions API com o **mesmo `event_id`** do `fbq` (a Meta deduplica). Limite de 60 eventos/min por IP por instância.
- Consentimento: exigido quando o locale do quiz é europeu **ou** o IP é do EEE/UK/CH (`x-vercel-ip-country`, via `GET /api/t/geo`). Sem aceite, o Pixel não carrega e a CAPI não é chamada; o funil interno continua contando.
- Lead: e-mail e telefone (E.164 com libphonenumber) validados no navegador e no servidor; na CAPI vão com SHA-256.
- `META_CAPI_TOKEN` só no servidor.

## Webhook Hotmart

`POST https://<STUDIO_HOST>/api/webhooks/hotmart` com `X-HOTMART-HOTTOK` (= `HOTMART_HOTTOK`). No Cloudflare Access, crie a regra **Bypass** só para `/api/webhooks/*`. Idempotente por `order_id` (reembolso/chargeback só atualiza o status). Grava só primeiro nome, cidade e país. O quiz é achado pelo `productId` da oferta publicada.

## Funil

`/quizzes/<id>/funnel`: sessões únicas por step da versão publicada, cliques no checkout e compras aprovadas; 7/30/90 dias, versão atual ou todas.

## Versões e templates

- `/quizzes/<id>/versions`: cada publicação é uma versão imutável. **Colocar no ar** faz rollback (só troca `published_version_id` e invalida o cache do runtime; não cria versão nova). **Copiar para o rascunho** traz a versão para edição (com lock otimista). Há pré-visualização de cada versão.
- Templates: salve o rascunho em Configurações do quiz; use em "Novo quiz → Começar de"; gerencie em `/templates`. Há um template padrão no código (`BUILT_IN_TEMPLATES`). Templates antigos passam por `parseDocument`, então migram junto com o schema.
