create table calls (
  id uuid default uuid_generate_v4() primary key,
  tenant_name text not null,
  email text not null,
  room text not null,
  fault_description text not null,
  fault_date timestamp with time zone not null,
  urgency text not null check (urgency in ('low', 'medium', 'high')),
  language text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
); 