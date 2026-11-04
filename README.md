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

Banco: aplique `supabase/migrations/` no projeto Supabase.

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
