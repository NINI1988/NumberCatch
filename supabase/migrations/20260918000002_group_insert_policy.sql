drop policy if exists "creator creates group" on public.groups;
create policy "authenticated creators create groups" on public.groups
  for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "creators read their groups" on public.groups
  for select to authenticated
  using (created_by = (select auth.uid()));
