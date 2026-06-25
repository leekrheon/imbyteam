-- ============================================
-- IMBY Team 스키마 보정 마이그레이션
-- (원본 테이블이 구버전 스키마로 먼저 생성되어 있어
--  누락된 컬럼/타입 불일치를 보정하는 SQL)
-- 이미 적용되었다면 다시 실행해도 안전합니다 (idempotent).
-- ============================================

-- 1) issues.assignee: uuid → text
--    (코드가 profiles.id가 아니라 이니셜 문자열을 저장하도록 설계되어 있음)
alter table issues drop constraint if exists issues_assignee_fkey;
alter table issues alter column assignee type text using assignee::text;
alter table issues alter column assignee set default '';

-- 2) ideas 누락 컬럼
alter table ideas add column if not exists author_ini text default '';
alter table ideas add column if not exists author_name text default '';
alter table ideas add column if not exists my_rating float default 0;
alter table ideas add column if not exists images jsonb default '[]';

-- 3) issues 누락 컬럼 (안전망 — 이미 있으면 건너뜀)
alter table issues add column if not exists priority int default 2;
alter table issues add column if not exists labels text[] default '{}';
alter table issues add column if not exists due date;
alter table issues add column if not exists cycle boolean default false;
alter table issues add column if not exists from_idea text default '';
alter table issues add column if not exists created_by uuid references profiles(id);
alter table issues add column if not exists updated_at timestamptz default now();

-- 4) idea_comments 누락 컬럼
alter table idea_comments add column if not exists author_ini text default '';
alter table idea_comments add column if not exists author_name text default '';

-- 5) briefs 누락 컬럼
alter table briefs add column if not exists idea_author_ini text default '';

-- 6) messages 누락 컬럼
alter table messages add column if not exists sender_ini text default '';
alter table messages add column if not exists sender_name text default '';
alter table messages add column if not exists event_data jsonb;

-- 7) attendance 누락 컬럼
alter table attendance add column if not exists user_ini text default '';

-- 8) notifications 누락 컬럼 + 타입 보정
alter table notifications add column if not exists ini text default '';
alter table notifications alter column extra type text using extra::text;
alter table notifications alter column extra set default '';

-- 9) PostgREST 스키마 캐시 갱신 (컬럼/타입 변경 후 필수)
NOTIFY pgrst, 'reload schema';
