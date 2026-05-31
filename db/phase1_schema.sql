-- ARIA Studio Phase 1 schema

create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text not null default 'facebook',
  fb_page_id text,
  fb_access_token text,
  niche text,
  audience text,
  tone text,
  bio text,
  personality_prompt text,
  content_pillars jsonb default '[]'::jsonb,
  posting_frequency text default 'daily',
  optimal_times jsonb default '[]'::jsonb,
  auto_publish boolean default false,
  trust_count integer default 0,
  accent_color text default '#bd20ad',
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references social_accounts(id) on delete cascade,
  source text default 'on_demand',
  prompt text,
  generated_text text,
  image_prompt text,
  image_url text,
  hashtags text,
  status text default 'draft',
  scheduled_for timestamptz,
  published_at timestamptz,
  fb_post_id text,
  error text,
  created_at timestamptz default now()
);

-- Public bucket for generated graphics (used in Phase 2)
insert into storage.buckets (id, name, public)
values ('social-images', 'social-images', true)
on conflict (id) do nothing;
