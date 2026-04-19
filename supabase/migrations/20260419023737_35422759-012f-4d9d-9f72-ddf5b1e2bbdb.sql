
ALTER TABLE public.developer_users
  ADD CONSTRAINT developer_users_developer_id_fkey
  FOREIGN KEY (developer_id) REFERENCES public.developers(id) ON DELETE CASCADE;
