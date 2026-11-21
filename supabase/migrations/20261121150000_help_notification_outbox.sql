-- Durable, service-only help-request notification outbox.
-- Apply after deploying the matching worker; do not run the worker until credentials are configured.
create schema if not exists private;
create table if not exists private.help_notification_outbox (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.help_requests(id) on delete cascade,
 channel text not null check (channel in ('email','whatsapp')),
 state text not null default 'pending' check (state in ('pending','leased','accepted','uncertain','dead')),
 attempts integer not null default 0 check (attempts between 0 and 8),
 next_attempt_at timestamptz not null default now(),
 lease_token uuid,
 lease_until timestamptz,
 provider_reference text,
 last_error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(request_id,channel),
 constraint valid_help_lease check ((state='leased')=(lease_token is not null and lease_until is not null))
);
create index if not exists help_outbox_due on private.help_notification_outbox(next_attempt_at) where state='pending';
alter table private.help_notification_outbox enable row level security;
revoke all on private.help_notification_outbox from public,anon,authenticated;
grant usage on schema private to service_role;
grant select,insert,update on private.help_notification_outbox to service_role;

create or replace function public.enqueue_help_notification(p_request_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists (select 1 from public.help_requests where id=p_request_id) then
   raise exception 'unknown_help_request';
 end if;
 insert into private.help_notification_outbox(request_id,channel)
 values(p_request_id,'email'),(p_request_id,'whatsapp')
 on conflict(request_id,channel) do nothing;
end $$;
revoke all on function public.enqueue_help_notification(uuid) from public,anon,authenticated;
grant execute on function public.enqueue_help_notification(uuid) to service_role;

create or replace function public.claim_help_notifications()
returns table(job_id uuid,request_id uuid,channel text,lease_token uuid,attempts integer)
language plpgsql security definer set search_path='' as $$
begin
 -- An expired lease may have reached the provider. Reconciliation is required
 -- before retry, to avoid duplicate messages.
 update private.help_notification_outbox q set state='uncertain',lease_token=null,
 lease_until=null,last_error='expired_lease_reconcile',updated_at=now()
 where q.state='leased' and q.lease_until<now();
 return query with candidates as (
  select q.id from private.help_notification_outbox q
  where q.state='pending' and q.next_attempt_at<=now() and q.attempts<8
  order by q.next_attempt_at,q.id for update skip locked limit 20
 ), claimed as (
  update private.help_notification_outbox q
  set state='leased',attempts=q.attempts+1,lease_token=gen_random_uuid(),
      lease_until=now()+interval '3 minutes',updated_at=now()
  from candidates c where q.id=c.id returning q.*
 )
 select c.id,c.request_id,c.channel,c.lease_token,c.attempts from claimed c;
end $$;
revoke all on function public.claim_help_notifications() from public,anon,authenticated;
grant execute on function public.claim_help_notifications() to service_role;

create or replace function public.finish_help_notification(p_id uuid,p_token uuid,p_outcome text,p_reference text default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare changed integer;
begin
 if p_outcome not in ('accepted','rejected','uncertain') then raise exception 'invalid_outcome'; end if;
 update private.help_notification_outbox q
 set state=case when p_outcome='rejected' then case when attempts>=8 then 'dead' else 'pending' end else p_outcome end,
 next_attempt_at=now()+make_interval(secs=>least(3600,(30*power(2,attempts))::integer)),
 lease_token=null,lease_until=null,
 provider_reference=case when p_outcome='accepted' then left(p_reference,200) else null end,
 last_error=case when p_outcome='accepted' then null else p_outcome end,updated_at=now()
 where q.id=p_id and q.state='leased' and q.lease_token=p_token and q.lease_until>now();
 get diagnostics changed=row_count;
 return changed=1;
end $$;
revoke all on function public.finish_help_notification(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.finish_help_notification(uuid,uuid,text,text) to service_role;

-- Enqueue in the same database transaction as the lead insert. A failed
-- queue insert aborts the lead insert rather than silently losing an alert.
-- Existing historical help requests are intentionally not replayed.
create or replace function private.help_notification_insert_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into private.help_notification_outbox(request_id,channel)
 values(new.id,'email'),(new.id,'whatsapp')
 on conflict(request_id,channel) do nothing;
 return new;
end $$;
drop trigger if exists help_notification_enqueue on public.help_requests;
create trigger help_notification_enqueue after insert on public.help_requests
for each row execute function private.help_notification_insert_trigger();
