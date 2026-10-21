
-- Ensure pg_net is available
create extension if not exists pg_net with schema extensions;

-- Seed shared webhook secret used by trigger -> edge fn handshake
insert into public.system_settings (key, value, description)
values (
  'welcome_webhook_secret',
  to_jsonb(encode(gen_random_bytes(32), 'hex')),
  'Shared secret sent by auth.users email-confirmation trigger to send-welcome-email edge function'
)
on conflict (key) do nothing;

insert into public.system_settings (key, value, description)
values (
  'project_functions_url',
  to_jsonb('https://kakkwibljrjsawxgnupk.supabase.co/functions/v1'::text),
  'Base URL for Lovable Cloud edge functions, used by DB triggers via pg_net'
)
on conflict (key) do nothing;

-- Trigger function: fires when email_confirmed_at transitions NULL -> NOT NULL
create or replace function public.notify_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
  v_url    text;
begin
  -- Only act on the NULL -> NOT NULL transition
  if new.email_confirmed_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    return new;
  end if;

  select value #>> '{}' into v_secret from public.system_settings where key = 'welcome_webhook_secret';
  select value #>> '{}' into v_url    from public.system_settings where key = 'project_functions_url';

  if v_secret is null or v_url is null then
    raise warning 'notify_email_confirmed: missing welcome_webhook_secret or project_functions_url';
    return new;
  end if;

  begin
    perform net.http_post(
      url     := v_url || '/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type',       'application/json',
        'x-welcome-secret',   v_secret
      ),
      body    := jsonb_build_object('user_id', new.id),
      timeout_milliseconds := 5000
    );
  exception when others then
    raise warning 'notify_email_confirmed: pg_net call failed: %', sqlerrm;
  end;

  return new;
end;
$$;

-- Recreate trigger
drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.notify_email_confirmed();
