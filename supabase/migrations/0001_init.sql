-- Anzol: schema inicial.
-- Acesso só pelo servidor (service role). RLS ligado sem policies = nega tudo para anon/authenticated.

create extension if not exists pgcrypto;

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  locale text not null check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  draft_document jsonb not null,
  draft_revision integer not null default 1,
  published_version_id uuid,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_versions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  version_number integer not null,
  schema_version integer not null,
  document jsonb not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (quiz_id, version_number)
);

alter table public.quizzes
  add constraint quizzes_published_version_fk
  foreign key (published_version_id) references public.quiz_versions(id);

-- Versões são imutáveis.
create function public.forbid_update() returns trigger language plpgsql as $$
begin
  raise exception 'quiz_versions é imutável';
end $$;
create trigger quiz_versions_immutable before update on public.quiz_versions
  for each row execute function public.forbid_update();

-- Domínio de oferta: host → quiz padrão (raiz). Outros quizzes no mesmo host via /{slug}.
create table public.domains (
  host text primary key check (host ~ '^[a-z0-9.-]+$'),
  default_quiz_id uuid references public.quizzes(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.quiz_domains (
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  host text not null references public.domains(host) on delete cascade,
  primary key (quiz_id, host)
);
create unique index quizzes_slug_key on public.quizzes (slug);

create table public.events (
  id bigint generated always as identity primary key,
  event_id uuid not null unique,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  version_id uuid not null references public.quiz_versions(id) on delete cascade,
  session_id text not null,
  step_id text,
  type text not null,
  utm jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_funnel_idx on public.events (quiz_id, version_id, type, step_id);
create index events_created_idx on public.events (quiz_id, created_at);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  session_id text not null,
  name text,
  email text,
  phone_e164 text,
  utm jsonb not null default '{}'::jsonb,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);
create index leads_quiz_idx on public.leads (quiz_id, created_at);

create table public.purchases (
  order_id text primary key,
  quiz_id uuid references public.quizzes(id) on delete set null,
  product_id text,
  status text not null default 'approved' check (status in ('approved', 'refunded', 'chargeback', 'canceled')),
  first_name text,
  country text,
  city text,
  amount numeric(12, 2),
  currency text,
  created_at timestamptz not null default now()
);
create index purchases_toast_idx on public.purchases (quiz_id, status, created_at desc);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('quiz', 'vsl')),
  document jsonb not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

alter table public.quizzes enable row level security;
alter table public.quiz_versions enable row level security;
alter table public.domains enable row level security;
alter table public.quiz_domains enable row level security;
alter table public.events enable row level security;
alter table public.leads enable row level security;
alter table public.purchases enable row level security;
alter table public.templates enable row level security;
