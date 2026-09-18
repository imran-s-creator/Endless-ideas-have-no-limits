create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  profile_image text,
  account_type text not null check (account_type in ('creator', 'company')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, profile_image, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'profile_image',
    coalesce(new.raw_user_meta_data ->> 'account_type', 'creator')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  creator_id uuid not null references public.profiles(id) on delete restrict,
  asking_price numeric(12, 2) not null check (asking_price >= 0),
  rights_type text not null,
  allows_transfer_resale boolean not null default false,
  status text not null default 'available' check (status in ('available', 'under_offer', 'sold')),
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'sold' and sold_at is not null) or status <> 'sold')
);

create table if not exists public.idea_purchases (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null unique references public.ideas(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12, 2) not null check (amount >= 0),
  rights_type text not null,
  purchased_at timestamptz not null default now()
);

alter table public.ideas enable row level security;
alter table public.idea_purchases enable row level security;

drop policy if exists "Ideas are viewable by everyone" on public.ideas;
create policy "Ideas are viewable by everyone"
  on public.ideas for select
  to anon, authenticated
  using (true);

drop policy if exists "Buyers and creators can view purchases" on public.idea_purchases;
create policy "Buyers and creators can view purchases"
  on public.idea_purchases for select
  to authenticated
  using (
    auth.uid() = buyer_id
    or exists (
      select 1 from public.ideas
      where ideas.id = idea_purchases.idea_id and ideas.creator_id = auth.uid()
    )
  );

create or replace function public.purchase_idea(p_idea_id uuid)
returns public.idea_purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  target_idea public.ideas;
  completed_purchase public.idea_purchases;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select * into target_idea
  from public.ideas
  where id = p_idea_id
  for update;

  if not found then
    raise exception 'IDEA_NOT_FOUND' using errcode = 'P0002';
  end if;

  if target_idea.creator_id = auth.uid() then
    raise exception 'CREATOR_CANNOT_PURCHASE';
  end if;

  if target_idea.status <> 'available' then
    raise exception 'IDEA_ALREADY_SOLD' using errcode = 'P0001';
  end if;

  update public.ideas
  set status = 'sold', sold_at = now()
  where id = target_idea.id;

  insert into public.idea_purchases (idea_id, buyer_id, amount, rights_type)
  values (target_idea.id, auth.uid(), target_idea.asking_price, target_idea.rights_type)
  returning * into completed_purchase;

  return completed_purchase;
end;
$$;

revoke all on function public.purchase_idea(uuid) from public;
grant execute on function public.purchase_idea(uuid) to authenticated;