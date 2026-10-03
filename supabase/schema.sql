-- SyncPad items 스키마. Supabase SQL Editor에 붙여넣어 실행한다.
-- 인가는 전부 RLS로 처리한다 (AGENTS.md §2).

create table public.items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  content      text not null default '',
  is_task      boolean not null default false,
  is_completed boolean not null default false,
  -- null = 미분류. 상단 탭 목록은 이 컬럼의 distinct 값에서 파생한다 (#37).
  -- 기존 DB: alter table public.items add column category text;
  category     text,
  sort_order   double precision not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.items enable row level security;

-- select/insert/update/delete 조건이 전부 같아서 for all 정책 하나로 끝낸다.
create policy items_owner_only on public.items
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index items_user_sort_idx on public.items (user_id, sort_order);

-- updated_at은 DB가 관리한다. 클라이언트가 매 write마다 챙기지 않게.
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger items_touch_updated_at before update on public.items
  for each row execute function public.touch_updated_at();

-- Realtime이 items 변경을 흘려보내게 publication에 등록한다 (#6).
-- 행 필터는 위 RLS 정책이 그대로 해준다.
alter publication supabase_realtime add table public.items;

-- 로그인된 기기 목록 (#92). auth 스키마는 API로 노출되지 않아 함수로 본인 세션만 꺼내 준다.
-- security definer라 RLS 대신 where 절의 auth.uid()가 인가를 맡는다. search_path를 비워 하이재킹을 막는다.
-- 기존 DB: 이 파일 전체가 아니라 이 블록(create ~ grant)만 SQL Editor에서 실행한다.
create function public.my_sessions()
returns table (id uuid, user_agent text, created_at timestamptz, last_active_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.user_agent, s.created_at, s.updated_at
  from auth.sessions s
  where s.user_id = auth.uid()
  order by s.updated_at desc
$$;

revoke execute on function public.my_sessions() from public, anon;
grant execute on function public.my_sessions() to authenticated;
