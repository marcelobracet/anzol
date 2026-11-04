-- Quiz dono de um produto (Hotmart/Kiwify): o publicado mais recente cuja oferta tem esse productId.
create or replace function public.quiz_for_product(p_product_id text)
returns uuid
language sql
stable
set search_path = ''
as $$
  select q.id
  from public.quizzes q
  join public.quiz_versions v on v.id = q.published_version_id
  where q.status = 'published'
    and v.document -> 'offers' @> jsonb_build_array(jsonb_build_object('productId', p_product_id))
  order by v.created_at desc
  limit 1;
$$;

-- Compra idempotente por order_id: o primeiro registro fica; reenvios só atualizam o status.
create or replace function public.record_purchase(
  p_order_id text,
  p_quiz_id uuid,
  p_product_id text,
  p_status text,
  p_first_name text,
  p_city text,
  p_country text,
  p_amount numeric,
  p_currency text,
  p_created_at timestamptz
)
returns void
language sql
set search_path = ''
as $$
  insert into public.purchases (order_id, quiz_id, product_id, status, first_name, city, country, amount, currency, created_at)
  values (p_order_id, p_quiz_id, p_product_id, p_status, p_first_name, p_city, p_country, p_amount, p_currency, p_created_at)
  on conflict (order_id) do update
    set status = excluded.status,
        quiz_id = coalesce(public.purchases.quiz_id, excluded.quiz_id);
$$;

-- Sessões únicas por tipo de evento e step, para o funil.
create or replace function public.funnel_stats(p_quiz_id uuid, p_version_id uuid, p_from timestamptz, p_to timestamptz)
returns table (type text, step_id text, sessions bigint)
language sql
stable
set search_path = ''
as $$
  select e.type, e.step_id, count(distinct e.session_id)
  from public.events e
  where e.quiz_id = p_quiz_id
    and (p_version_id is null or e.version_id = p_version_id)
    and e.created_at >= p_from and e.created_at < p_to
  group by e.type, e.step_id;
$$;

create index if not exists events_session_idx on public.events (quiz_id, created_at, session_id);

revoke execute on function public.quiz_for_product(text) from public, anon, authenticated;
revoke execute on function public.record_purchase(text, uuid, text, text, text, text, text, numeric, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.funnel_stats(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
