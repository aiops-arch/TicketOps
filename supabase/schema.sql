create extension if not exists pgcrypto;

create table if not exists outlets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists technicians (
  id text primary key,
  name text not null,
  skill text not null,
  status text not null default 'Absent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tickets (
  id text primary key,
  outlet text not null references outlets(name),
  category text not null,
  impact text not null,
  note text not null,
  priority text not null,
  status text not null,
  assigned_to text references technicians(id),
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

create index if not exists idx_tickets_status on tickets(status);
create index if not exists idx_tickets_assigned_to on tickets(assigned_to);
create index if not exists idx_ticket_history_ticket_id on ticket_history(ticket_id);
create index if not exists idx_attendance_events_technician_id on attendance_events(technician_id);

insert into outlets (name)
values ('Outlet 1'), ('Outlet 2'), ('Outlet 3'), ('Outlet 4')
on conflict (name) do nothing;

insert into technicians (id, name, skill, status)
values
  ('T1', 'Technician 1', 'AC', 'Present'),
  ('T2', 'Technician 2', 'Refrigeration', 'Present'),
  ('T3', 'Technician 3', 'Electrical', 'Break'),
  ('T4', 'Technician 4', 'Plumbing', 'Absent')
on conflict (id) do update set
  name = excluded.name,
  skill = excluded.skill,
  status = excluded.status,
  updated_at = now();
