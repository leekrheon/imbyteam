-- ① profiles
create table if not exists profiles (
  id uuid references auth.users primary key,
  name text not null default '',
  ini text not null default '',
  role text default '',
  working boolean default false,
  work_started_at timestamptz,
  theme text default 'white',
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);

-- ② issues
create table if not exists issues (
  id text primary key,
  title text not null,
  description text default '',
  status text default 'backlog',
  priority int default 2,
  assignee text default '',
  labels text[] default '{}',
  due date,
  cycle boolean default false,
  from_idea text default '',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table issues enable row level security;
create policy "issues_all" on issues for all using (true);

-- ③ ideas
create table if not exists ideas (
  id text primary key,
  title text not null,
  description text default '',
  author_ini text default '',
  author_name text default '',
  author_id uuid references profiles(id),
  status text default 'review',
  tags text[] default '{}',
  recs int default 0,
  rec_by text[] default '{}',
  rating_sum float default 0,
  rating_count int default 0,
  my_rating float default 0,
  images jsonb default '[]',
  created_at timestamptz default now()
);
alter table ideas enable row level security;
create policy "ideas_all" on ideas for all using (true);

-- ④ idea_comments
create table if not exists idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id text references ideas(id) on delete cascade,
  author_ini text default '',
  author_name text default '',
  author_id uuid references profiles(id),
  text text not null,
  created_at timestamptz default now()
);
alter table idea_comments enable row level security;
create policy "idea_comments_all" on idea_comments for all using (true);

-- ⑤ briefs
create table if not exists briefs (
  id text primary key,
  idea_id text references ideas(id),
  idea_author_ini text default '',
  title text not null,
  sections jsonb default '{}',
  edit_log jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table briefs enable row level security;
create policy "briefs_all" on briefs for all using (true);

-- ⑥ events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  start_time text default '종일',
  end_time text default '',
  place text default '',
  color text default '',
  event_type text default 'team',
  attendees text[] default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table events enable row level security;
create policy "events_all" on events for all using (true);

-- ⑦ messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  sender_ini text default '',
  sender_name text default '',
  sender_id uuid references profiles(id),
  text text not null,
  ref_data jsonb,
  event_data jsonb,
  created_at timestamptz default now()
);
alter table messages enable row level security;
create policy "messages_all" on messages for all using (true);

-- ⑧ time_polls
create table if not exists time_polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slots jsonb not null default '[]',
  votes jsonb default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table time_polls enable row level security;
create policy "time_polls_all" on time_polls for all using (true);

-- ⑨ attendance
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  user_ini text default '',
  date date not null,
  start_ms bigint default 0,
  end_ms bigint default 0,
  total_minutes int default 0,
  unique(user_id, date)
);
alter table attendance enable row level security;
create policy "attendance_select" on attendance for select using (true);
create policy "attendance_modify" on attendance for all using (auth.uid() = user_id);

-- ⑩ notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  kind text not null,
  title text default '',
  issue_id text,
  event_id uuid,
  idea_id text,
  ini text default '',
  extra text default '',
  read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "notifications_select" on notifications for select using (auth.uid() = user_id);
create policy "notifications_modify" on notifications for all using (auth.uid() = user_id);
create policy "notifications_insert" on notifications for insert with check (true);

-- ⑪ Realtime 활성화
alter publication supabase_realtime add table issues;
alter publication supabase_realtime add table ideas;
alter publication supabase_realtime add table idea_comments;
alter publication supabase_realtime add table briefs;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table time_polls;
alter publication supabase_realtime add table attendance;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table profiles;

-- ⑫ 회원가입 시 profiles 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, ini, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'ini', ''),
    coalesce(new.raw_user_meta_data->>'role', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 추가 테이블: 별점 / 북마크
-- ============================================

-- 사용자별 아이디어 별점
create table if not exists idea_ratings (
  id uuid primary key default gen_random_uuid(),
  idea_id text references ideas(id) on delete cascade,
  user_id uuid references profiles(id),
  user_ini text default '',
  rating int default 0,
  created_at timestamptz default now(),
  unique(idea_id, user_id)
);
alter table idea_ratings enable row level security;
create policy "idea_ratings_all" on idea_ratings for all using (true);
alter publication supabase_realtime add table idea_ratings;

-- 아이디어 북마크
create table if not exists idea_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  idea_id text references ideas(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, idea_id)
);
alter table idea_bookmarks enable row level security;
create policy "idea_bookmarks_all" on idea_bookmarks for all using (true);
alter publication supabase_realtime add table idea_bookmarks;
