-- Tela de Leads: respostas por sessão e indicadores no estilo "visitantes → interagiram → qualificados → completos".

alter table public.events add column if not exists answer jsonb;
create index if not exists events_quiz_session_idx on public.events (quiz_id, session_id);
create index if not exists leads_quiz_session_idx on public.leads (quiz_id, session_id);

-- Mesmas regras de src/features/dashboard/leads.ts (computeKpis).
create or replace function public.lead_kpis(
  p_quiz_id uuid,
  p_version_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_qualified_min int,
  p_last_step text
)
returns table (visitors bigint, interacted bigint, qualified bigint, completed bigint, contacts bigint)
language sql
stable
set search_path = ''
as $$
  select
    count(*),
    count(*) filter (where s.viewed >= 2),
    count(*) filter (where s.viewed >= p_qualified_min),
    count(*) filter (where s.saw_last),
    count(*) filter (where s.has_lead)
  from (
    select
      e.session_id,
      count(distinct e.step_id) filter (where e.type = 'step_view') as viewed,
      coalesce(bool_or(e.type = 'step_view' and e.step_id = p_last_step), false) as saw_last,
      bool_or(e.type = 'lead') as has_lead
    from public.events e
    where e.quiz_id = p_quiz_id
      and (p_version_id is null or e.version_id = p_version_id)
      and e.created_at >= p_from and e.created_at < p_to
    group by e.session_id
  ) s;
$$;

-- Uma linha por sessão, mais recente primeiro, com a última resposta de cada pergunta e o último lead.
-- p_pattern (ILIKE já escapado) busca em nome/e-mail/telefone; p_option_ids são as opções cujo texto bate com a busca.
create or replace function public.lead_sessions(
  p_quiz_id uuid,
  p_version_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_pattern text,
  p_option_ids text[],
  p_limit int,
  p_offset int
)
returns table (
  session_id text,
  started_at timestamptz,
  utm jsonb,
  viewed text[],
  answers jsonb,
  checkout boolean,
  lead_name text,
  lead_email text,
  lead_phone text,
  total bigint
)
language sql
stable
set search_path = ''
as $$
  with scoped as (
    select e.*
    from public.events e
    where e.quiz_id = p_quiz_id
      and (p_version_id is null or e.version_id = p_version_id)
      and e.created_at >= p_from and e.created_at < p_to
  ),
  last_answers as (
    select distinct on (a.session_id, a.step_id) a.session_id, a.step_id, a.answer -> 'optionIds' as option_ids
    from scoped a
    where a.type = 'answer' and a.answer is not null
    order by a.session_id, a.step_id, a.created_at desc, a.id desc
  ),
  sessions as (
    select
      s.session_id,
      min(s.created_at) as started_at,
      (array_agg(s.utm order by s.created_at, s.id))[1] as utm,
      coalesce(array_agg(distinct s.step_id) filter (where s.type = 'step_view' and s.step_id is not null), '{}') as viewed,
      bool_or(s.type = 'checkout_click') as checkout
    from scoped s
    group by s.session_id
  ),
  rows as (
    select
      s.*,
      coalesce((select jsonb_object_agg(la.step_id, la.option_ids) from last_answers la where la.session_id = s.session_id), '{}'::jsonb) as answers,
      coalesce((
        select array_agg(o.value)
        from last_answers la, jsonb_array_elements_text(la.option_ids) o
        where la.session_id = s.session_id
      ), '{}') as option_ids,
      l.name as lead_name,
      l.email as lead_email,
      l.phone_e164 as lead_phone
    from sessions s
    left join lateral (
      select ld.name, ld.email, ld.phone_e164
      from public.leads ld
      where ld.quiz_id = p_quiz_id and ld.session_id = s.session_id
      order by ld.created_at desc
      limit 1
    ) l on true
  )
  select r.session_id, r.started_at, r.utm, r.viewed, r.answers, r.checkout, r.lead_name, r.lead_email, r.lead_phone,
    count(*) over () as total
  from rows r
  where p_pattern is null
    or r.lead_name ilike p_pattern
    or r.lead_email ilike p_pattern
    or r.lead_phone ilike p_pattern
    or r.option_ids && coalesce(p_option_ids, '{}')
  order by r.started_at desc, r.session_id
  limit p_limit offset p_offset;
$$;

revoke execute on function public.lead_kpis(uuid, uuid, timestamptz, timestamptz, int, text) from public, anon, authenticated;
revoke execute on function public.lead_sessions(uuid, uuid, timestamptz, timestamptz, text, text[], int, int) from public, anon, authenticated;
