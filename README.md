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

### Ver o runtime sem banco

Em `npm run dev`, http://demo.localhost:3000 serve um quiz de demonstração (`src/features/runtime/demo-document.ts`). Só existe em `next dev`; em build de produção e previews esse host vai ao banco como qualquer outro.

## Runtime

- Rota interna `/r/[host]/[[...slug]]`: raiz do domínio = `domains.default_quiz_id`; `/{slug}` = quiz ligado ao domínio em `quiz_domains`.
- Lê só a versão publicada (`published_quiz()` no Postgres), nunca o rascunho.
- Cache com `'use cache'` + tags `runtime:host:<host>` e `runtime:quiz:<id>`; publicar invalida as tags.
- Imagens via Cloudinary (`CLOUDINARY_CLOUD_NAME`); GIFs são entregues como mp4.

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
