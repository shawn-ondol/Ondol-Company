-- ─── 상담 신청 보안 수정 ───
-- 방문자: 신청서 제출(INSERT)만 가능, 읽기/수정/삭제 불가
-- 관리자(joshim3472@gmail.com으로 로그인): 읽기 + 상태 변경 가능
-- 기존 데이터는 건드리지 않습니다.

-- 1) 누구나 읽을 수 있던 정책 제거
drop policy if exists "Anyone can select consultations" on public.consultations;
drop policy if exists "Allow public select on consultations" on public.consultations;

-- 2) 비로그인(anon)은 제출만
revoke select, update, delete on table public.consultations from anon;
grant insert on table public.consultations to anon;

-- 3) 로그인 사용자 권한 (실제 접근은 아래 정책이 관리자 이메일로 제한)
revoke delete on table public.consultations from authenticated;
grant select, insert, update on table public.consultations to authenticated;

drop policy if exists "Admin can read consultations" on public.consultations;
drop policy if exists "Admin can update consultations" on public.consultations;

create policy "Admin can read consultations"
  on public.consultations
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'joshim3472@gmail.com');

create policy "Admin can update consultations"
  on public.consultations
  for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'joshim3472@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'joshim3472@gmail.com');

-- 4) 확인: 아래 결과에 insert 1개 + Admin 정책 2개만 보이면 성공
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'consultations'
order by policyname;
