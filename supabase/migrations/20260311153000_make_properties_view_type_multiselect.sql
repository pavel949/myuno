alter table public.properties
alter column view_type type text[]
using case
  when view_type is null or btrim(view_type) = '' then null
  else array[view_type]
end;
