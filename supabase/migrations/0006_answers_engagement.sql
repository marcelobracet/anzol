-- Respostas do quiz e engajamento por sessão (painel do Studio).
-- Evento "answer": opções escolhidas numa pergunta, enviado quando a pessoa avança. Só ids de opção (sem texto livre, sem dado pessoal).
alter table public.events add column if not exists option_ids text[]
  check (option_ids is null or (cardinality(option_ids) between 1 and 20));

create index if not exists events_answer_idx
  on public.events (quiz_id, created_at)
  where type = 'answer';

-- Profundidade: quantas sessões viram 1, 2, 3… steps diferentes (visitantes, interação, qualificados, completos).
create or replace function public.session_depth(p_quiz_id uuid, p_version_id uuid, p_from timestamptz, p_to timestamptz)
returns table (viewed integer, sessions bigint)
language sql
stable
set search_path = ''
as $$
  select per_session.viewed, count(*)
  from (
    select e.session_id, count(distinct e.step_id)::integer as viewed
    from public.events e
    where e.quiz_id = p_quiz_id
      and e.type = 'step_view'
      and (p_version_id is null or e.version_id = p_version_id)
      and e.created_at >= p_from and e.created_at < p_to
    group by e.session_id
  ) per_session
  group by per_session.viewed;
$$;

-- Última resposta de cada sessão em cada pergunta (quem voltou e mudou vale a última).
create or replace function public.latest_answers(p_quiz_id uuid, p_version_id uuid, p_from timestamptz, p_to timestamptz)
returns table (session_id text, step_id text, option_ids text[], created_at timestamptz)
language sql
stable
set search_path = ''
as $$
  select distinct on (e.session_id, e.step_id) e.session_id, e.step_id, e.option_ids, e.created_at
  from public.events e
  where e.quiz_id = p_quiz_id
    and e.type = 'answer'
    and e.option_ids is not null
    and (p_version_id is null or e.version_id = p_version_id)
    and e.created_at >= p_from and e.created_at < p_to
  order by e.session_id, e.step_id, e.created_at desc, e.id desc;
$$;

-- Distribuição: quantas sessões escolheram cada opção de cada pergunta.
-- A linha com option_id nulo é o total de sessões que responderam aquela pergunta.
create or replace function public.answer_distribution(p_quiz_id uuid, p_version_id uuid, p_from timestamptz, p_to timestamptz)
returns table (step_id text, option_id text, sessions bigint)
language sql
stable
set search_path = ''
as $$
  select a.step_id, opt.option_id, count(distinct a.session_id)
  from public.latest_answers(p_quiz_id, p_version_id, p_from, p_to) a
  cross join lateral unnest(a.option_ids) as opt(option_id)
  group by grouping sets ((a.step_id, opt.option_id), (a.step_id));
$$;

-- Lista de respostas por sessão (mais recentes primeiro), com lead e origem (UTM do primeiro evento).
-- p_search filtra por nome, e-mail ou telefone do lead.
create or replace function public.recent_responses(
  p_quiz_id uuid, p_version_id uuid, p_from timestamptz, p_to timestamptz,
  p_search text, p_limit integer, p_offset integer
)
returns table (
  session_id text, started_at timestamptz, last_at timestamptz, steps_viewed integer,
  answers jsonb, lead_name text, lead_email text, lead_phone text, utm jsonb, total bigint
)
language sql
stable
set search_path = ''
as $$
  with sessions as (
    select e.session_id,
           min(e.created_at) as started_at,
           max(e.created_at) as last_at,
           count(distinct e.step_id) filter (where e.type = 'step_view')::integer as steps_viewed,
           (array_agg(e.utm order by e.id))[1] as utm
    from public.events e
    where e.quiz_id = p_quiz_id
      and (p_version_id is null or e.version_id = p_version_id)
      and e.created_at >= p_from and e.created_at < p_to
    group by e.session_id
  ),
  answers as (
    select a.session_id, jsonb_object_agg(a.step_id, to_jsonb(a.option_ids)) as answers
    from public.latest_answers(p_quiz_id, p_version_id, p_from, p_to) a
    group by a.session_id
  ),
  leads as (
    select distinct on (l.session_id) l.session_id, l.name, l.email, l.phone_e164
    from public.leads l
    where l.quiz_id = p_quiz_id
    order by l.session_id, l.created_at desc
  ),
  joined as (
    select s.session_id, s.started_at, s.last_at, s.steps_viewed,
           coalesce(a.answers, '{}'::jsonb) as answers,
           l.name as lead_name, l.email as lead_email, l.phone_e164 as lead_phone, s.utm
    from sessions s
    left join answers a on a.session_id = s.session_id
    left join leads l on l.session_id = s.session_id
    -- Só sessões que interagiram (respondeu algo, virou lead ou passou do primeiro step).
    where (a.session_id is not null or l.session_id is not null or s.steps_viewed > 1)
      and (
        coalesce(p_search, '') = ''
        or l.name ilike '%' || p_search || '%'
        or l.email ilike '%' || p_search || '%'
        or l.phone_e164 ilike '%' || p_search || '%'
      )
  )
  select j.*, count(*) over () as total
  from joined j
  order by j.last_at desc
  limit least(greatest(p_limit, 1), 500) offset greatest(p_offset, 0);
$$;

revoke execute on function public.session_depth(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.latest_answers(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.answer_distribution(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.recent_responses(uuid, uuid, timestamptz, timestamptz, text, integer, integer) from public, anon, authenticated;
