-- items RLS 검증. Supabase SQL Editor에 붙여넣어 실행한다.
-- 가짜 유저 A/B를 만들어 A로 로그인한 척 B의 행을 건드려 보고, 끝에 rollback해서 흔적을 남기지 않는다.
-- 통과하면 'RLS OK' notice, 실패하면 exception으로 멈춘다.
-- ponytail: 수동 실행. CLI/테스트 DB가 생기면 CI로 옮긴다.

begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b');
insert into public.items (user_id, content) values
  ('00000000-0000-0000-0000-00000000000a', 'A의 메모'),
  ('00000000-0000-0000-0000-00000000000b', 'B의 메모');
-- my_sessions() 확인용 (#92). A 세션 1개, B 세션 1개.
insert into auth.sessions (id, user_id, created_at, updated_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', now(), now());

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

do $$
declare n int;
begin
  select count(*) into n from public.items;
  if n <> 1 then raise exception 'select: A가 % 행을 본다 (기대 1)', n; end if;

  update public.items set content = '탈취' where user_id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'update: A가 B의 행 %개를 고쳤다', n; end if;

  delete from public.items where user_id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'delete: A가 B의 행 %개를 지웠다', n; end if;

  begin
    insert into public.items (user_id, content) values ('00000000-0000-0000-0000-00000000000b', '위조');
    raise exception 'insert: A가 B 명의로 행을 만들었다';
  exception when insufficient_privilege then null; -- with check 위반 = 기대한 결과
  end;

  update public.items set user_id = '00000000-0000-0000-0000-00000000000b'
    where user_id = '00000000-0000-0000-0000-00000000000a';
  raise exception 'update: A가 자기 행을 B에게 넘겼다';
exception
  when insufficient_privilege then raise notice 'RLS OK';
end $$;

-- my_sessions()는 security definer라 RLS가 아니라 함수 안 where 절이 막는다.
do $$
declare n int;
begin
  select count(*) into n from public.my_sessions() s
    where s.id <> '00000000-0000-0000-0000-0000000000a1';
  if n <> 0 then raise exception 'my_sessions: A가 남의 세션 %개를 본다', n; end if;
  select count(*) into n from public.my_sessions();
  if n <> 1 then raise exception 'my_sessions: A가 자기 세션을 못 본다'; end if;
  if has_function_privilege('anon', 'public.my_sessions()', 'execute') then
    raise exception 'my_sessions: anon이 실행할 수 있다';
  end if;
  raise notice 'my_sessions OK';
end $$;

rollback;
