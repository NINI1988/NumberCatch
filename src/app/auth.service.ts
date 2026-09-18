import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly profile = signal<Profile | null>(null);
  constructor(private readonly supabase: SupabaseService) {}
  async signIn(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }
  async signUp(email: string, password: string, name: string): Promise<string | null> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (!error && data.user)
      this.profile.set({
        id: data.user.id,
        display_name: name,
        avatar_url: null,
        current_number: 0,
      });
    return error?.message ?? null;
  }
  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.profile.set(null);
  }
  async initialize(): Promise<void> {
    const { data } = await this.supabase.client.auth.getUser();
    if (data.user) this.profile.set(await this.supabase.profile(data.user.id));
  }
}
