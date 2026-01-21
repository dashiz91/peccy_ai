-- =============================================
-- PECCY AI - Database Schema
-- =============================================

-- =============================================
-- ENUMS
-- =============================================

create type generation_status as enum ('pending', 'analyzing', 'generating', 'completed', 'failed');
create type image_type as enum ('main', 'infographic_1', 'infographic_2', 'lifestyle', 'comparison', 'framework_preview');
create type transaction_type as enum ('purchase', 'usage', 'refund', 'bonus');

-- =============================================
-- PROFILES TABLE
-- Extends Supabase auth.users
-- =============================================

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  credits integer default 10 not null, -- Start with 10 free credits
  stripe_customer_id text, -- Stripe customer ID for payments
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- GENERATIONS TABLE
-- Stores each generation session
-- =============================================

create table public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_title text not null,
  product_description text,
  features text[],
  target_audience text,
  brand_name text,
  status generation_status default 'pending' not null,
  framework_data jsonb, -- All generated frameworks from analysis
  selected_framework jsonb, -- The user's selected framework
  image_prompts jsonb, -- Generated prompts for each image type
  color_mode text, -- 'ai_decides', 'suggest_primary', 'locked_palette'
  locked_colors text[], -- Hex colors if locked
  style_reference_path text, -- Path to style reference in storage
  global_note text, -- User's custom instructions
  credits_used integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.generations enable row level security;

-- Policies
create policy "Users can view their own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can create their own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own generations"
  on public.generations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own generations"
  on public.generations for delete
  using (auth.uid() = user_id);

-- Index for faster queries
create index generations_user_id_idx on public.generations(user_id);
create index generations_status_idx on public.generations(status);

-- =============================================
-- GENERATED IMAGES TABLE
-- Stores each generated image
-- =============================================

create table public.generated_images (
  id uuid default gen_random_uuid() primary key,
  generation_id uuid references public.generations(id) on delete cascade not null,
  image_type image_type not null,
  storage_path text not null, -- Path in Supabase Storage
  prompt_used text, -- The actual prompt sent to Gemini
  version integer default 1 not null, -- For regenerations
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.generated_images enable row level security;

-- Policies (through generation ownership)
create policy "Users can view images from their generations"
  on public.generated_images for select
  using (
    exists (
      select 1 from public.generations
      where generations.id = generated_images.generation_id
      and generations.user_id = auth.uid()
    )
  );

create policy "Users can create images for their generations"
  on public.generated_images for insert
  with check (
    exists (
      select 1 from public.generations
      where generations.id = generated_images.generation_id
      and generations.user_id = auth.uid()
    )
  );

-- Index
create index generated_images_generation_id_idx on public.generated_images(generation_id);

-- =============================================
-- CREDIT TRANSACTIONS TABLE
-- Audit log for all credit changes
-- =============================================

create table public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null, -- Positive for additions, negative for usage
  type transaction_type not null,
  description text,
  generation_id uuid references public.generations(id) on delete set null, -- Link to generation if usage
  stripe_payment_id text, -- Stripe payment intent ID if purchase
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.credit_transactions enable row level security;

-- Policies
create policy "Users can view their own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- Service role can insert (via API)
create policy "Service can insert transactions"
  on public.credit_transactions for insert
  with check (true); -- Will be restricted by service role

-- Index
create index credit_transactions_user_id_idx on public.credit_transactions(user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to deduct credits atomically
-- Overload 1: With generation_id
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_generation_id uuid,
  p_description text default 'Image generation'
)
returns boolean as $$
declare
  v_current_credits integer;
begin
  -- Get current credits with row lock
  select credits into v_current_credits
  from public.profiles
  where id = p_user_id
  for update;

  -- Check if enough credits
  if v_current_credits < p_amount then
    return false;
  end if;

  -- Deduct credits
  update public.profiles
  set credits = credits - p_amount,
      updated_at = now()
  where id = p_user_id;

  -- Log transaction
  insert into public.credit_transactions (user_id, amount, type, description, generation_id)
  values (p_user_id, -p_amount, 'usage', p_description, p_generation_id);

  return true;
end;
$$ language plpgsql security definer;

-- Overload 2: Without generation_id (for simple deductions)
create or replace function public.deduct_credits(
  user_id uuid,
  amount integer,
  description text default 'Image generation'
)
returns boolean as $$
begin
  return public.deduct_credits(user_id, amount, null::uuid, description);
end;
$$ language plpgsql security definer;

-- Function to add credits (for purchases)
create or replace function public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_stripe_payment_id text,
  p_description text default 'Credit purchase'
)
returns void as $$
begin
  -- Add credits
  update public.profiles
  set credits = credits + p_amount,
      updated_at = now()
  where id = p_user_id;

  -- Log transaction
  insert into public.credit_transactions (user_id, amount, type, description, stripe_payment_id)
  values (p_user_id, p_amount, 'purchase', p_description, p_stripe_payment_id);
end;
$$ language plpgsql security definer;

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_generations_updated_at
  before update on public.generations
  for each row execute procedure public.handle_updated_at();
