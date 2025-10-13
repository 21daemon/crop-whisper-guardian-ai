-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles RLS policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create trigger function for new user profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name');
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create diagnoses table
create table public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  crop_id text default 'cotton' not null,
  image_url text not null,
  disease_name text not null,
  confidence numeric(5,2) default 0,
  diagnosis_text text,
  insights text,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS on diagnoses
alter table public.diagnoses enable row level security;

-- Diagnoses RLS policies
create policy "Users can view their own diagnoses"
  on public.diagnoses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own diagnoses"
  on public.diagnoses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own diagnoses"
  on public.diagnoses for delete
  using (auth.uid() = user_id);