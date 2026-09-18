export type SightingType = 'confirmed' | 'hint';
export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  current_number: number;
}
export interface Sighting {
  id: string;
  user_id: string;
  number: number;
  type: SightingType;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  note: string | null;
  created_at: string;
}
export interface PendingSighting {
  client_id: string;
  number: number;
  type: SightingType;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  note: string | null;
  created_at: string;
}
export interface FriendProgress extends Profile {
  group_id: string;
}
export interface PlayerGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}
export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
  profile: Profile;
}
