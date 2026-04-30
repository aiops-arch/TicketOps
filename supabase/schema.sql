create extension if not exists pgcrypto;

create table if not exists outlets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now()
);

alter table outlets add column if not exists address text;
alter table outlets add column if not exists latitude numeric;
alter table outlets add column if not exists longitude numeric;

create table if not exists categories (
  id text primary key,
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists app_users (
  id text primary key,
  username text not null unique,
  password_hash text,
  display_name text not null,
  post text not null,
  role text not null check (role in ('admin', 'manager', 'technician')),
  outlet text references outlets(name),
  technician_id text,
  access_all_outlets boolean not null default false,
  allowed_outlets text[] not null default '{}',
  address text,
  latitude numeric,
  longitude numeric,
  default_view text not null default 'dashboard',
  allowed_views text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_users add column if not exists access_all_outlets boolean not null default false;
alter table app_users add column if not exists allowed_outlets text[] not null default '{}';
alter table app_users add column if not exists address text;
alter table app_users add column if not exists latitude numeric;
alter table app_users add column if not exists longitude numeric;

create table if not exists assets (
  id text primary key,
  outlet text not null references outlets(name),
  category text not null,
  name text not null,
  code text unique,
  status text not null default 'Active',
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists technicians (
  id text primary key,
  name text not null,
  skill text not null,
  status text not null default 'Absent',
  quality integer not null default 90,
  service_outlets text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table technicians add column if not exists quality integer not null default 90;
alter table technicians add column if not exists service_outlets text[] not null default '{}';

create table if not exists tickets (
  id text primary key,
  outlet text not null references outlets(name),
  category text not null,
  asset_id text references assets(id),
  impact text not null,
  area text,
  note text not null,
  priority text not null,
  status text not null,
  assigned_to text references technicians(id),
  scheduled_at timestamptz,
  latest_detail text,
  photo_url text,
  photo_urls text[] not null default '{}',
  resolution_photo_urls text[] not null default '{}',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tickets add column if not exists created_by text;
alter table tickets add column if not exists scheduled_at timestamptz;
alter table tickets add column if not exists photo_url text;
alter table tickets add column if not exists photo_urls text[] not null default '{}';
alter table tickets add column if not exists resolution_photo_urls text[] not null default '{}';
alter table tickets add column if not exists asset_id text references assets(id);
alter table tickets add column if not exists area text;

create table if not exists tasks (
  id text primary key,
  title text not null,
  asset_id text not null references assets(id),
  outlet text not null references outlets(name),
  assigned_to text not null references technicians(id),
  status text not null default 'Pending',
  task_date date not null,
  completed_at timestamptz,
  evidence_comment text,
  evidence_photo_url text,
  evidence_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks add column if not exists evidence_comment text;
alter table tasks add column if not exists evidence_photo_url text;
alter table tasks add column if not exists evidence_at timestamptz;

create table if not exists maintenance_rules (
  id text primary key,
  category text not null,
  title text not null,
  phase text not null default 'Checklist',
  rule_group text not null default 'Maintenance',
  frequency text not null check (frequency in ('daily', 'weekly')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ticket_history (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null references tickets(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create table if not exists attendance_events (
  id uuid primary key default gen_random_uuid(),
  technician_id text not null references technicians(id),
  status text not null,
  marked_by text not null default 'system',
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists attendance_plans (
  id uuid primary key default gen_random_uuid(),
  technician_id text not null references technicians(id),
  status text not null,
  from_date date not null,
  to_date date not null,
  reason text,
  created_by text not null default 'system',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (to_date >= from_date)
);

create index if not exists idx_tickets_status on tickets(status);
create index if not exists idx_tickets_assigned_to on tickets(assigned_to);
create index if not exists idx_tickets_asset_id on tickets(asset_id);
create index if not exists idx_app_users_role on app_users(role);
create index if not exists idx_app_users_technician_id on app_users(technician_id);
create index if not exists idx_assets_outlet on assets(outlet);
create index if not exists idx_assets_category on assets(category);
create index if not exists idx_assets_status on assets(status);
create index if not exists idx_tasks_assigned_date on tasks(assigned_to, task_date);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_asset on tasks(asset_id);
create index if not exists idx_maintenance_rules_category on maintenance_rules(category);
create index if not exists idx_maintenance_rules_frequency_active on maintenance_rules(frequency, active);
create index if not exists idx_ticket_history_ticket_id on ticket_history(ticket_id);
create index if not exists idx_attendance_events_technician_id on attendance_events(technician_id);
create index if not exists idx_attendance_plans_technician_dates on attendance_plans(technician_id, from_date, to_date);

insert into outlets (name)
values ('aiko surat'), ('Capiche')
on conflict (name) do nothing;

insert into categories (id, name, description)
values
  ('C-AC', 'AC', 'Air conditioning and ventilation'),
  ('C-REF', 'Refrigeration', 'Freezers, chillers, cold rooms'),
  ('C-ELEC', 'Electrical', 'Power, panels, lighting'),
  ('C-PLUMB', 'Plumbing', 'Water supply, drains, dishwash area'),
  ('C-KITCHEN', 'Kitchen Equipment', 'Ovens, fryers, burners, dishwashers')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description;

insert into assets (id, outlet, category, name, code, status, notes)
values
  ('A-1001', 'aiko surat', 'Refrigeration', 'Walk-in Freezer', 'AIKO-REF-01', 'Active', 'Primary cold storage'),
  ('A-1002', 'Capiche', 'Plumbing', 'Dishwash Drain Line', 'CAP-PLUMB-01', 'Active', 'Back-of-house wash area')
on conflict (id) do nothing;

insert into technicians (id, name, skill, status, quality, service_outlets)
values
  ('T1', 'Vicky', 'AC', 'Present', 92, array['aiko surat', 'Capiche']),
  ('T2', 'Rahul Patil', 'Refrigeration', 'Present', 95, array['aiko surat']),
  ('T3', 'Abrar', 'Plumbing', 'Break', 89, array['Capiche'])
on conflict (id) do update set
  name = excluded.name,
  skill = excluded.skill,
  status = excluded.status,
  quality = excluded.quality,
  service_outlets = excluded.service_outlets,
  updated_at = now();

insert into app_users (id, username, password_hash, display_name, post, role, outlet, technician_id, access_all_outlets, allowed_outlets, default_view, allowed_views)
values
  ('U-ADMIN-AIOPS', 'aiops', 'pbkdf2:120000:a1b2c3d4e5f60708:888871d5e5ac38b1cce1fcff51ad7bd18e72436def796616789a6c031f43fa6e', 'AIops', 'Admin Control Panel Operator', 'admin', null, null, true, array[]::text[], 'dashboard', array['dashboard', 'manager', 'admin', 'masters', 'scheduler', 'reports']),
  ('U-ADMIN-CHINTAN', 'chintan.patel', 'pbkdf2:120000:982c18b51e794bf4cb87e8642731c2cc:73c5cbd85cb7994067ded367b738fdb5ee55a4aa2c0a0d057d4a5553f2097b44', 'Chintan Patel', 'Admin Control Panel Operator', 'admin', null, null, true, array[]::text[], 'dashboard', array['dashboard', 'manager', 'admin', 'masters', 'scheduler', 'reports']),
  ('U-ADMIN-MEET', 'meet.patel', 'pbkdf2:120000:bbcdabab57be3c89299580e74f5bdfb5:f4bff0d92c29c9c5f8acb3f73bd2981549ea5e024f80c81590d5de198c10492b', 'Meet Patel', 'Admin Control Panel Operator', 'admin', null, null, true, array[]::text[], 'dashboard', array['dashboard', 'manager', 'admin', 'masters', 'scheduler', 'reports']),
  ('U-MGR-PRATIK', 'pratik.patel', 'pbkdf2:120000:d9778cb8f2cacd1633eeb0239cd22d87:923afc6207abf49b386396850d5df74eda4166b1dfe40a1a97bc87a8a4b6023c', 'Pratik Patel', 'Outlet Manager', 'manager', 'aiko surat', null, false, array['aiko surat'], 'dashboard', array['dashboard', 'manager', 'reports']),
  ('U-MGR-HUSSAIN', 'hussain.sheikh', 'pbkdf2:120000:5542a0b2e59554516ae58e01deb207ac:52f76c3bf884aac40e9bbeae6bcd36d753cf1d38a15ae1ff45c3549ad24a23db', 'Hussain Sheikh', 'Outlet Manager', 'manager', 'Capiche', null, false, array['Capiche'], 'dashboard', array['dashboard', 'manager', 'reports']),
  ('U-TECH-VICKY', 'vicky', 'pbkdf2:120000:7bfc5ae8cbd0ebb81b40b6b588d26788:aa230c800b2e3483804198abee0567ee6fd021195cbaeabdf82d97725a51d44f', 'Vicky', 'Technician', 'technician', 'aiko surat', 'T1', false, array['aiko surat', 'Capiche'], 'dashboard', array['dashboard', 'technician', 'reports']),
  ('U-TECH-RAHUL', 'rahul.patil', 'pbkdf2:120000:968b19eef77ef131c769fb07e287f00c:cccd93f76578cf8cb992e67e6279b142b933fa89b9cb8a717c484666c61e8556', 'Rahul Patil', 'Technician', 'technician', 'aiko surat', 'T2', false, array['aiko surat'], 'dashboard', array['dashboard', 'technician', 'reports']),
  ('U-TECH-ABRAR', 'abrar', 'pbkdf2:120000:88f7489f0b8b0ab0bb115b31b9ad9eba:0dbaba9c4c3a887788fed5cefb39ad5e74160eaf49c13a0689d25a69adc77497', 'Abrar', 'Technician', 'technician', 'Capiche', 'T3', false, array['Capiche'], 'dashboard', array['dashboard', 'technician', 'reports'])
on conflict (id) do update set
  username = excluded.username,
  password_hash = excluded.password_hash,
  display_name = excluded.display_name,
  post = excluded.post,
  role = excluded.role,
  outlet = excluded.outlet,
  technician_id = excluded.technician_id,
  access_all_outlets = excluded.access_all_outlets,
  allowed_outlets = excluded.allowed_outlets,
  allowed_views = excluded.allowed_views,
  updated_at = now();

insert into maintenance_rules (id, category, title, phase, rule_group, frequency, active)
values
  ('MR-D-001', 'Refrigeration', 'Refrigerator temperature checked (2-5 C)', 'Morning Opening', 'Equipment Check', 'daily', true),
  ('MR-D-002', 'Refrigeration', 'Freezer working (-18 C or below)', 'Morning Opening', 'Equipment Check', 'daily', true),
  ('MR-D-003', 'Kitchen Equipment', 'Gas stove / burners functional', 'Morning Opening', 'Equipment Check', 'daily', true),
  ('MR-D-004', 'Plumbing', 'Water supply working', 'Morning Opening', 'Utilities Check', 'daily', true),
  ('MR-W-001', 'Refrigeration', 'Clean refrigerator coils', 'Weekly', 'Weekly Maintenance', 'weekly', true),
  ('MR-W-002', 'Plumbing', 'Inspect plumbing for leaks', 'Weekly', 'Weekly Maintenance', 'weekly', true)
on conflict (id) do update set
  category = excluded.category,
  title = excluded.title,
  phase = excluded.phase,
  rule_group = excluded.rule_group,
  frequency = excluded.frequency,
  active = excluded.active,
  updated_at = now();

insert into tasks (id, title, asset_id, outlet, assigned_to, status, task_date)
values
  ('TASK-20260427-001', 'Morning Opening: Refrigerator temperature checked (2-5 C)', 'A-1001', 'aiko surat', 'T2', 'Pending', '2026-04-27'),
  ('TASK-20260427-002', 'Morning Opening: Freezer working (-18 C or below)', 'A-1001', 'aiko surat', 'T2', 'Pending', '2026-04-27'),
  ('TASK-20260427-003', 'Morning Opening: Water supply working', 'A-1002', 'Capiche', 'T3', 'Pending', '2026-04-27'),
  ('TASK-20260427-004', 'Closing: Grease traps cleaned', 'A-1002', 'Capiche', 'T3', 'Pending', '2026-04-27')
on conflict (id) do nothing;

insert into tickets (id, outlet, category, impact, note, priority, status, assigned_to, latest_detail, created_at)
values
  (
    'TK-1001',
    'aiko surat',
    'Refrigeration',
    'Food safety risk',
    'Freezer temperature rising',
    'P1',
    'New',
    null,
    '',
    '2026-04-25T00:00:00.000Z'
  ),
  (
    'TK-1002',
    'Capiche',
    'Plumbing',
    'Normal repair',
    'Dishwash area drain slow',
    'P3',
    'Assigned',
    'T3',
    '',
    '2026-04-25T00:00:00.000Z'
  )
on conflict (id) do nothing;

update tickets set created_by = 'U-MGR-PRATIK' where id = 'TK-1001' and created_by is null;
update tickets set created_by = 'U-MGR-HUSSAIN' where id = 'TK-1002' and created_by is null;

insert into ticket_history (ticket_id, action, created_at)
select 'TK-1001', 'Ticket created by Pratik Patel', '2026-04-25T00:00:00.000Z'
where not exists (
  select 1 from ticket_history where ticket_id = 'TK-1001' and action = 'Ticket created by Pratik Patel'
);

insert into ticket_history (ticket_id, action, created_at)
select 'TK-1002', 'Ticket created', '2026-04-25T00:00:00.000Z'
where not exists (
  select 1 from ticket_history where ticket_id = 'TK-1002' and action = 'Ticket created'
);

insert into ticket_history (ticket_id, action, created_at)
select 'TK-1002', 'Assigned to Abrar', '2026-04-25T00:00:00.000Z'
where not exists (
  select 1 from ticket_history where ticket_id = 'TK-1002' and action = 'Assigned to Abrar'
);

update tickets set assigned_to = 'T3' where assigned_to = 'T4';
delete from technicians where id = 'T4';

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
