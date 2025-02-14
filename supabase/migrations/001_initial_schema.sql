-- Enable necessary extensions
create extension if not exists "postgis";
create extension if not exists "uuid-ossp";

-- User Profiles with enhanced security features
create table public.profiles (
  id uuid references auth.users on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  phone_number text,
  emergency_contacts jsonb[],
  blood_group text,
  medical_conditions text[],
  trusted_contacts uuid[],
  last_known_location geometry(Point, 4326),
  last_active timestamp with time zone,
  device_tokens text[],
  safety_score numeric default 0,
  verification_status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Real-time Location Tracking
create table public.user_locations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  location geometry(Point, 4326) not null,
  accuracy float,
  heading float,
  speed float,
  timestamp timestamp with time zone default now(),
  battery_level integer,
  is_charging boolean,
  network_status text
);

-- Incident Reports with enhanced features
create table public.incident_reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id),
  type text not null,
  subtype text,
  severity integer check (severity between 1 and 5),
  location geometry(Point, 4326) not null,
  description text,
  media_urls text[],
  witnesses uuid[] references public.profiles(id),
  status text default 'pending',
  verification_count integer default 0,
  verified_by uuid[] references public.profiles(id),
  emergency_services_notified boolean default false,
  response_time interval,
  resolution_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Campus Safety Features
create table public.campus_zones (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null,
  boundary geometry(Polygon, 4326) not null,
  risk_level integer default 1,
  operating_hours jsonb,
  security_features jsonb,
  emergency_contacts jsonb,
  created_at timestamp with time zone default now()
);

-- Security Infrastructure
create table public.security_features (
  id uuid default uuid_generate_v4() primary key,
  type text not null,
  location geometry(Point, 4326) not null,
  status text default 'active',
  last_checked timestamp with time zone,
  maintenance_history jsonb[],
  responsible_authority uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- Emergency Services
create table public.emergency_services (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null,
  location geometry(Point, 4326) not null,
  contact_numbers text[],
  operating_hours jsonb,
  coverage_area geometry(Polygon, 4326),
  response_time_avg interval,
  available_resources jsonb,
  created_at timestamp with time zone default now()
);

-- Real-time Alerts
create table public.safety_alerts (
  id uuid default uuid_generate_v4() primary key,
  type text not null,
  severity integer check (severity between 1 and 5),
  location geometry(Point, 4326) not null,
  radius float,
  message text,
  affected_users uuid[] references public.profiles(id),
  expiry timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index user_locations_user_id_idx on public.user_locations(user_id);
create index user_locations_timestamp_idx on public.user_locations(timestamp);
create index incident_reports_location_idx on public.incident_reports using gist(location);
create index campus_zones_boundary_idx on public.campus_zones using gist(boundary);
create index security_features_location_idx on public.security_features using gist(location);

-- Row Level Security Policies
alter table public.profiles enable row level security;
alter table public.user_locations enable row level security;
alter table public.incident_reports enable row level security;
alter table public.campus_zones enable row level security;
alter table public.security_features enable row level security;
alter table public.emergency_services enable row level security;
alter table public.safety_alerts enable row level security;

-- Profiles security policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Location tracking policies
create policy "Users can insert their own location"
  on public.user_locations for insert
  with check (auth.uid() = user_id);

create policy "Users can view locations of trusted contacts"
  on public.user_locations for select
  using (
    auth.uid() = user_id or
    auth.uid() in (
      select unnest(trusted_contacts)
      from public.profiles
      where id = user_id
    )
  );

-- Incident reporting policies
create policy "Anyone can report incidents"
  on public.incident_reports for insert
  with check (auth.uid() = reporter_id);

create policy "Public can view non-sensitive incident details"
  on public.incident_reports for select
  using (true);

-- Functions and Triggers
create or replace function update_safety_score()
returns trigger as $$
begin
  -- Complex safety score calculation based on various factors
  -- Implementation here
  return new;
end;
$$ language plpgsql;

create trigger update_user_safety_score
  after insert or update on public.incident_reports
  for each row
  execute function update_safety_score();

-- Realtime notification function
create or replace function notify_emergency_contacts()
returns trigger as $$
begin
  if new.severity <= 2 then  -- High severity incidents
    -- Notification logic here
  end if;
  return new;
end;
$$ language plpgsql;

create trigger emergency_notification
  after insert on public.incident_reports
  for each row
  execute function notify_emergency_contacts(); 