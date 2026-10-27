-- Mafube ICT Services starter database schema (Supabase/PostgreSQL)
-- Run only after creating a Supabase project and reviewing the policies below.
create extension if not exists pgcrypto;

create table if not exists public.customer_enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  company_name text,
  email text not null,
  phone text,
  service_interest text,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','quoted','closed','spam')),
  source text not null default 'website'
);
create index if not exists customer_enquiries_created_at_idx on public.customer_enquiries(created_at desc);
create index if not exists customer_enquiries_status_idx on public.customer_enquiries(status);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sku text unique,
  name text not null,
  description text,
  category text,
  price numeric(12,2) check (price is null or price >= 0),
  currency char(3) not null default 'ZAR',
  active boolean not null default true,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0)
);
create index if not exists products_active_category_idx on public.products(active, category);

create table if not exists public.service_opportunities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  opportunity_type text not null,
  estimated_value numeric(12,2) check (estimated_value is null or estimated_value >= 0),
  next_follow_up date,
  status text not null default 'open' check (status in ('open','contacted','qualified','quoted','won','lost')),
  notes text
);
create index if not exists service_opportunities_follow_up_idx on public.service_opportunities(next_follow_up);
create index if not exists service_opportunities_status_idx on public.service_opportunities(status);

-- Enable row-level security. Public website visitors can read only active product catalogue entries.
alter table public.products enable row level security;
alter table public.customer_enquiries enable row level security;
alter table public.service_opportunities enable row level security;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products
  for select to anon, authenticated using (active = true);

-- No public INSERT/SELECT policies for enquiries or opportunities by design.
-- Add submissions via a server-side Edge Function/API with validation and rate limiting.
-- Never place the service_role key in website HTML or JavaScript.
