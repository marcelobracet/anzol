-- Retenção do vídeo: cada evento vsl_progress guarda o marco (segundo) que a sessão alcançou.
alter table public.events add column if not exists video_second integer
  check (video_second is null or (video_second >= 0 and video_second <= 21600));

create index if not exists events_vsl_progress_idx
  on public.events (quiz_id, step_id, created_at)
  where type = 'vsl_progress';

-- Histograma por step: quantas sessões pararam em cada segundo máximo assistido.
create or replace function public.vsl_retention(p_quiz_id uuid, p_version_id uuid, p_from timestamptz, p_to timestamptz)
returns table (step_id text, max_second integer, sessions bigint)
language sql
stable
set search_path = ''
as $$
  select per_session.step_id, per_session.max_second, count(*)
  from (
    select e.step_id, e.session_id, max(e.video_second) as max_second
    from public.events e
    where e.quiz_id = p_quiz_id
      and e.type = 'vsl_progress'
      and e.video_second is not null
      and (p_version_id is null or e.version_id = p_version_id)
      and e.created_at >= p_from and e.created_at < p_to
    group by e.step_id, e.session_id
  ) per_session
  group by per_session.step_id, per_session.max_second;
$$;

revoke execute on function public.vsl_retention(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
