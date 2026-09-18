create or replace function public.is_group_member(target_group uuid, target_user uuid default auth.uid()) returns boolean
language sql security definer stable set search_path = public
as $$ select exists (select 1 from public.group_members where group_id = target_group and user_id = target_user) $$;

drop policy if exists "group members read groups" on public.groups;
create policy "group members read groups" on public.groups for select using (public.is_group_member(id));
drop policy if exists "members read membership" on public.group_members;
create policy "members read membership" on public.group_members for select using (public.is_group_member(group_id));

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do update set public = true;
create policy "avatar images are publicly readable" on storage.objects for select using (bucket_id = 'avatars');
create policy "users upload their avatar" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "users update their avatar" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "users delete their avatar" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
