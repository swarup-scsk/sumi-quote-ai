create table public.rfqs (
  rfq_id text primary key,
  customer_name text not null,
  subject text not null,
  filename text not null,
  received_at timestamptz not null default now(),
  status text not null,
  overall_confidence numeric,
  flagged_field_count int,
  spec_card jsonb,
  quote jsonb,
  error_message text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.rfqs to authenticated;
grant all on public.rfqs to service_role;

alter table public.rfqs enable row level security;

create policy "Authenticated users can view all rfqs"
  on public.rfqs for select to authenticated using (true);

create policy "Authenticated users can insert rfqs"
  on public.rfqs for insert to authenticated with check (true);

create policy "Authenticated users can update rfqs"
  on public.rfqs for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete rfqs"
  on public.rfqs for delete to authenticated using (true);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger rfqs_set_updated_at
  before update on public.rfqs
  for each row execute function public.set_updated_at();

alter table public.rfqs replica identity full;
alter publication supabase_realtime add table public.rfqs;