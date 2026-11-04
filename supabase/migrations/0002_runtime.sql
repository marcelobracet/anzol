-- Runtime: busca a versão publicada de um quiz por domínio numa única chamada.
-- Raiz do domínio (p_slug null) = domains.default_quiz_id; /{slug} = quiz ligado ao domínio em quiz_domains.
create or replace function public.published_quiz(p_host text, p_slug text default null)
returns table (
  quiz_id uuid,
  slug text,
  locale text,
  currency text,
  version_id uuid,
  version_number integer,
  document jsonb
)
language sql
stable
set search_path = ''
as $$
  select q.id, q.slug, q.locale, q.currency, v.id, v.version_number, v.document
  from public.quizzes q
  join public.quiz_versions v on v.id = q.published_version_id
  where q.status = 'published'
    and (
      (p_slug is null and q.id = (select d.default_quiz_id from public.domains d where d.host = p_host))
      or (
        p_slug is not null
        and q.slug = p_slug
        and exists (select 1 from public.quiz_domains qd where qd.quiz_id = q.id and qd.host = p_host)
      )
    )
  limit 1;
$$;

-- Só o service role (servidor) chama.
revoke execute on function public.published_quiz(text, text) from public, anon, authenticated;
