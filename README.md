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

### Usar o Studio sem banco

Em `npm run dev` sem `SUPABASE_URL`, o Studio usa um armazenamento em memória (some ao reiniciar) e simula o cadastro de domínio na Vercel. Só vale em `next dev`.

### Ver o runtime sem banco

Em `npm run dev`, http://demo.localhost:3000 serve um quiz de demonstração (`src/features/runtime/demo-document.ts`). Só existe em `next dev`; em build de produção e previews esse host vai ao banco como qualquer outro.

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
