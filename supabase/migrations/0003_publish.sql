-- Publica o rascunho de uma revisão específica como nova versão imutável, numa transação.
create or replace function public.publish_quiz(p_quiz_id uuid, p_expected_revision integer, p_created_by text)
returns table (version_id uuid, version_number integer)
language plpgsql
set search_path = ''
as $$
declare
  v_document jsonb;
  v_number integer;
  v_id uuid;
begin
  select q.draft_document into v_document
  from public.quizzes q
  where q.id = p_quiz_id and q.draft_revision = p_expected_revision and q.status <> 'archived'
  for update;

  if not found then
    raise exception 'revision_conflict';
  end if;

  select coalesce(max(qv.version_number), 0) + 1 into v_number
  from public.quiz_versions qv
  where qv.quiz_id = p_quiz_id;

  insert into public.quiz_versions (quiz_id, version_number, schema_version, document, created_by)
  values (p_quiz_id, v_number, (v_document ->> 'schemaVersion')::integer, v_document, p_created_by)
  returning id into v_id;

  update public.quizzes
  set published_version_id = v_id, status = 'published', updated_at = now()
  where id = p_quiz_id;

  return query select v_id, v_number;
end;
$$;

revoke execute on function public.publish_quiz(uuid, integer, text) from public, anon, authenticated;
