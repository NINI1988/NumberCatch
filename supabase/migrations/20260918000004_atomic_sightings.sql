-- Confirmations must be unique; existing duplicates are deliberately not deleted.
create unique index sightings_confirmed_user_number_key
  on public.sightings (user_id, number)
  where type = 'confirmed';

-- Only the capture function may create sightings or change progress.
revoke insert, update on public.sightings from public, anon, authenticated;
drop policy "own sightings insert" on public.sightings;
drop policy "own sightings update" on public.sightings;
drop policy "own sightings delete" on public.sightings;
create policy "users delete own hints" on public.sightings
  for delete to authenticated
  using (user_id = (select auth.uid()) and type = 'hint');

revoke insert, update on public.profiles from public, anon, authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name, avatar_url, updated_at) on public.profiles to authenticated;

create function public.capture_sighting(
  p_number integer,
  p_type public.sighting_type,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_accuracy double precision default null,
  p_note text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  player public.profiles;
  player_id uuid := auth.uid();
begin
  if player_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_number is null or p_number not between 1 and 999 or p_type is null then
    raise exception 'Invalid capture' using errcode = '22023';
  end if;
  if (p_latitude is null) <> (p_longitude is null)
    or (p_accuracy is not null and p_latitude is null) then
    raise exception 'Invalid coordinates' using errcode = '22023';
  end if;

  -- Serialize captures for this player, including requests from other tabs/devices.
  select * into player from public.profiles where id = player_id for update;
  if not found then
    raise exception 'Profile missing' using errcode = '42501';
  end if;
  if p_number <= player.current_number then
    raise exception 'Number already completed' using errcode = 'NC001';
  end if;
  if p_type = 'confirmed' and p_number <> player.current_number + 1 then
    raise exception 'Number is not next' using errcode = 'NC002';
  end if;
  -- A hint must never become a confirmation automatically.
  if p_type = 'hint' and p_number <= player.current_number + 1 then
    raise exception 'Number is no longer a future hint' using errcode = 'NC002';
  end if;

  insert into public.sightings (user_id, number, type, latitude, longitude, accuracy, note)
  values (player_id, p_number, p_type, p_latitude, p_longitude, p_accuracy, p_note);

  if p_type = 'confirmed' then
    update public.profiles
      set current_number = p_number, updated_at = now()
      where id = player_id
      returning * into player;
  end if;
  return player;
end;
$$;

revoke all on function public.capture_sighting(integer, public.sighting_type, double precision, double precision, double precision, text)
  from public, anon;
grant execute on function public.capture_sighting(integer, public.sighting_type, double precision, double precision, double precision, text)
  to authenticated;
