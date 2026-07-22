-- =====================================================================
-- STAREHE BOOKING MANAGEMENT SYSTEM — SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- Run top to bottom, once, on a fresh project.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- USERS (mirrors auth.users; holds role + profile info for everyone
-- who logs in: club patrons, senior masters, welfare head, admin)
-- ---------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'club_patron'
    check (role in ('club_patron', 'sm1', 'sm2', 'sm3', 'sm4', 'welfare_head', 'admin')),
  club_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- TEACHERS (no login — captured at time of booking only)
-- ---------------------------------------------------------------------
create table public.teachers (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  department text not null,
  email text not null,
  phone_number text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CLUB PATRONS (extra club-specific info beyond the users table)
-- ---------------------------------------------------------------------
create table public.club_patrons (
  id uuid primary key references public.users(id) on delete cascade,
  club_name text not null,
  patron_name text,
  phone_number text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RESOURCES (the bookable inventory: projectors, buses, labs)
-- ---------------------------------------------------------------------
create table public.resources (
  id uuid primary key default uuid_generate_v4(),
  resource_type text not null check (resource_type in ('projector', 'bus', 'computer_lab')),
  identifier text not null,        -- e.g. "Projector-04", "Bus KAA 123X", "Lab B"
  status text not null default 'available'
    check (status in ('available', 'booked', 'in_use', 'returned', 'maintenance')),
  location text,
  condition text default 'good',
  current_holder text,
  issue_date date,
  expected_return_date date,
  returned_date date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- BOOKINGS (single-resource teacher bookings AND top-level club function bookings)
-- ---------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  booking_number text unique not null,
  booking_type text not null check (booking_type in ('teacher', 'club_function')),

  -- Teacher booking fields
  teacher_id uuid references public.teachers(id),

  -- Club function fields
  club_patron_id uuid references public.club_patrons(id),
  function_name text,
  venue text,
  expected_students int,
  special_requirements text,

  -- Shared fields
  resource_id uuid references public.resources(id),
  resource_type text check (resource_type in ('projector', 'bus', 'computer_lab')),
  quantity int default 1,
  booking_date date not null,
  booking_time time,
  purpose text,
  duration text,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'completed', 'cancelled')),

  return_status text default 'not_returned'
    check (return_status in ('not_returned', 'returned')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bookings_club_patron on public.bookings(club_patron_id);
create index idx_bookings_status on public.bookings(status);

-- ---------------------------------------------------------------------
-- MASTER LISTS (one per club function — the spreadsheet header)
-- ---------------------------------------------------------------------
create table public.master_lists (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  function_name text not null,
  club_name text not null,
  venue text,
  function_date date not null,
  function_time time,
  teacher_in_charge text,
  purpose text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'locked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MASTER LIST STUDENTS (the spreadsheet rows)
-- ---------------------------------------------------------------------
create table public.master_list_students (
  id uuid primary key default uuid_generate_v4(),
  master_list_id uuid not null references public.master_lists(id) on delete cascade,
  row_number int not null,
  admission_number text,
  student_name text,
  class text,
  stream text,
  phone_number text,
  parent_contact text,
  remarks text,
  attendance_status text default 'expected'
    check (attendance_status in ('expected', 'present', 'absent')),
  created_at timestamptz not null default now()
);

create index idx_mls_master_list on public.master_list_students(master_list_id);

-- ---------------------------------------------------------------------
-- REQUISITIONS (resource request form tied to a booking)
-- ---------------------------------------------------------------------
create table public.requisitions (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  needs_bus boolean default false,
  needs_food boolean default false,
  needs_water boolean default false,
  needs_projector boolean default false,
  needs_computer_lab boolean default false,
  needs_sound_system boolean default false,
  needs_microphone boolean default false,
  needs_other boolean default false,
  other_description text,
  requirements_description text,
  estimated_students int,
  departure_time time,
  return_time time,
  special_notes text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'locked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- APPROVALS (one row per approver per booking — the workflow chain)
-- ---------------------------------------------------------------------
create table public.approvals (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  approver_role text not null check (approver_role in ('sm1', 'sm2', 'sm3', 'sm4', 'welfare_head')),
  approver_id uuid references public.users(id),
  sequence_order int not null,          -- 1 = SM1, 2 = SM2, 3 = SM3, 4 = SM4, 5 = Welfare Head
  decision text default 'pending' check (decision in ('pending', 'approved', 'rejected')),
  comment text,
  signature_id uuid,                    -- FK added after signatures table exists
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_approvals_booking on public.approvals(booking_id);

-- ---------------------------------------------------------------------
-- SIGNATURES (image captured from the signature pad, stored in Supabase Storage)
-- ---------------------------------------------------------------------
create table public.signatures (
  id uuid primary key default uuid_generate_v4(),
  approval_id uuid references public.approvals(id) on delete cascade,
  signer_id uuid references public.users(id),
  signer_role text not null,
  storage_path text not null,      -- path inside the "signatures" Supabase Storage bucket
  signed_at timestamptz not null default now()
);

alter table public.approvals
  add constraint fk_approvals_signature
  foreign key (signature_id) references public.signatures(id);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  type text not null check (
    type in ('booking_approved', 'booking_rejected', 'pending_approval', 'upcoming_event', 'resource_returned', 'email_sent')
  ),
  message text not null,
  is_read boolean default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, is_read);

-- ---------------------------------------------------------------------
-- INVENTORY LOG (issue / return history per resource)
-- ---------------------------------------------------------------------
create table public.inventory_logs (
  id uuid primary key default uuid_generate_v4(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  booking_id uuid references public.bookings(id),
  action text not null check (action in ('issued', 'returned', 'maintenance_flagged', 'maintenance_cleared')),
  actor_id uuid references public.users(id),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RETURNS (teacher / patron resource return records)
-- ---------------------------------------------------------------------
create table public.returns (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  resource_id uuid not null references public.resources(id),
  returned_date date not null default current_date,
  condition text,
  comments text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- EMAILS (send log — what was sent, to whom, and delivery status)
-- ---------------------------------------------------------------------
create table public.emails (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references public.bookings(id),
  recipient_email text not null,
  subject text not null,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  sent_at timestamptz not null default now()
);

-- =====================================================================
-- BOOKING NUMBER GENERATOR
-- Format: SBMS-2026-000123
-- =====================================================================
create sequence if not exists booking_number_seq start 1;

create or replace function public.generate_booking_number()
returns text as $$
declare
  next_val int;
begin
  next_val := nextval('booking_number_seq');
  return 'SBMS-' || to_char(current_date, 'YYYY') || '-' || lpad(next_val::text, 6, '0');
end;
$$ language plpgsql;

create or replace function public.set_booking_number()
returns trigger as $$
begin
  if new.booking_number is null then
    new.booking_number := public.generate_booking_number();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_booking_number
  before insert on public.bookings
  for each row execute function public.set_booking_number();

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();
create trigger trg_master_lists_touch before update on public.master_lists
  for each row execute function public.touch_updated_at();
create trigger trg_requisitions_touch before update on public.requisitions
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.users enable row level security;
alter table public.club_patrons enable row level security;
alter table public.bookings enable row level security;
alter table public.master_lists enable row level security;
alter table public.master_list_students enable row level security;
alter table public.requisitions enable row level security;
alter table public.approvals enable row level security;
alter table public.signatures enable row level security;
alter table public.notifications enable row level security;
alter table public.resources enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.returns enable row level security;

-- Users can read their own profile; admins read all
create policy "users_select_own" on public.users
  for select using (auth.uid() = id or exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
  ));

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

-- Club patrons manage their own profile row
create policy "club_patrons_select_own" on public.club_patrons
  for select using (auth.uid() = id);
create policy "club_patrons_update_own" on public.club_patrons
  for update using (auth.uid() = id);
create policy "club_patrons_insert_own" on public.club_patrons
  for insert with check (auth.uid() = id);

-- Bookings: patrons see their own; approvers/admin see all pending in their stage or everything
create policy "bookings_select_own_or_staff" on public.bookings
  for select using (
    club_patron_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('sm1','sm2','sm3','sm4','welfare_head','admin'))
  );

create policy "bookings_insert_own" on public.bookings
  for insert with check (club_patron_id = auth.uid() or booking_type = 'teacher');

create policy "bookings_update_own_or_staff" on public.bookings
  for update using (
    club_patron_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('sm1','sm2','sm3','sm4','welfare_head','admin'))
  );

-- Resources: readable by any authenticated user (availability must be visible), writes via staff only
create policy "resources_select_all" on public.resources for select using (true);
create policy "resources_write_staff" on public.resources
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin','welfare_head')));

-- Notifications: users see their own only
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());

-- Master lists / requisitions / approvals / signatures / returns / logs follow the parent booking
create policy "master_lists_via_booking" on public.master_lists
  for all using (exists (
    select 1 from public.bookings b where b.id = master_lists.booking_id
    and (b.club_patron_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('sm1','sm2','sm3','sm4','welfare_head','admin')))
  ));

create policy "mls_students_via_booking" on public.master_list_students
  for all using (exists (
    select 1 from public.master_lists ml join public.bookings b on b.id = ml.booking_id
    where ml.id = master_list_students.master_list_id
    and (b.club_patron_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('sm1','sm2','sm3','sm4','welfare_head','admin')))
  ));

create policy "requisitions_via_booking" on public.requisitions
  for all using (exists (
    select 1 from public.bookings b where b.id = requisitions.booking_id
    and (b.club_patron_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('sm1','sm2','sm3','sm4','welfare_head','admin')))
  ));

create policy "approvals_via_booking" on public.approvals
  for all using (exists (
    select 1 from public.bookings b where b.id = approvals.booking_id
    and (b.club_patron_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('sm1','sm2','sm3','sm4','welfare_head','admin')))
  ));

create policy "signatures_via_approval" on public.signatures
  for all using (exists (
    select 1 from public.approvals a join public.bookings b on b.id = a.booking_id
    where a.id = signatures.approval_id
    and (b.club_patron_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('sm1','sm2','sm3','sm4','welfare_head','admin')))
  ));

create policy "returns_via_booking" on public.returns
  for all using (exists (
    select 1 from public.bookings b where b.id = returns.booking_id
    and (b.club_patron_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('sm1','sm2','sm3','sm4','welfare_head','admin')))
  ));

create policy "inventory_logs_staff_only" on public.inventory_logs
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin','welfare_head')));

-- =====================================================================
-- SEED DATA — a starter set of resources so the app isn't empty on first run
-- =====================================================================
insert into public.resources (resource_type, identifier, status, location) values
  ('projector', 'Projector-01', 'available', 'AV Store'),
  ('projector', 'Projector-02', 'available', 'AV Store'),
  ('projector', 'Projector-03', 'available', 'AV Store'),
  ('bus', 'Bus KCA 221A', 'available', 'Transport Bay'),
  ('bus', 'Bus KCA 445B', 'available', 'Transport Bay'),
  ('computer_lab', 'Computer Lab A', 'available', 'Main Block'),
  ('computer_lab', 'Computer Lab B', 'available', 'ICT Wing');

-- =====================================================================
-- STORAGE BUCKET for signatures (run once — safe if it already exists)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

-- =====================================================================
-- CREATE NEW USER TRIGGER (for Supabase Auth integration)
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
  club_nm text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'club_patron');
  club_nm := new.raw_user_meta_data->>'club_name';

  -- Insert profile row
  insert into public.users (id, email, full_name, role, club_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', club_nm, ''),
    user_role,
    club_nm
  );

  -- If the role is club_patron, insert into club_patrons as well
  if user_role = 'club_patron' then
    insert into public.club_patrons (id, club_name)
    values (
      new.id,
      coalesce(club_nm, '')
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
