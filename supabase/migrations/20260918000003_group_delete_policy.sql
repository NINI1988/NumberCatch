create policy "creators delete groups" on public.groups
  for delete to authenticated
  using (created_by = (select auth.uid()));
