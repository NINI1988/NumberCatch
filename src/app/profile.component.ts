import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="page narrow">
    <a routerLink="/numbers" class="back-link">← Zahlen</a>
    <p class="eyebrow">DEIN KONTO</p>
    <h1>Profil</h1>
    <div class="profile-card">
      <div
        class="profile-avatar"
        [style.background-image]="
          auth.profile()?.avatar_url ? 'url(' + auth.profile()?.avatar_url + ')' : null
        "
      >
        {{ auth.profile()?.avatar_url ? '' : initials() }}
      </div>
      <label class="upload-label"
        >Avatar ändern<input type="file" accept="image/*" (change)="upload($event)" /></label
      ><label>Anzeigename<input [(ngModel)]="name" maxlength="80" /></label
      ><button class="primary full" (click)="save()">Profil speichern</button>
      <p class="muted" *ngIf="message">{{ message }}</p>
    </div>
    <button class="secondary full" (click)="logout()">Ausloggen</button>
  </section>`,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  name = '';
  message = '';
  constructor() {
    this.name = this.auth.profile()?.display_name ?? '';
  }
  initials(): string {
    return (this.auth.profile()?.display_name ?? 'Du').slice(0, 2).toUpperCase();
  }
  async save(): Promise<void> {
    const profile = this.auth.profile();
    if (!profile || !this.name.trim()) return;
    try {
      await this.supabase.updateProfile(profile.id, this.name);
      this.auth.profile.set({ ...profile, display_name: this.name.trim() });
      this.message = 'Profil gespeichert.';
    } catch {
      this.message = 'Profil konnte nicht gespeichert werden.';
    }
  }
  async upload(event: Event): Promise<void> {
    const profile = this.auth.profile();
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!profile || !file) return;
    try {
      const url = await this.supabase.uploadAvatar(profile.id, file);
      this.auth.profile.set({ ...profile, avatar_url: url });
      this.message = 'Avatar gespeichert.';
    } catch {
      this.message = 'Avatar konnte nicht gespeichert werden.';
    }
  }
  async logout(): Promise<void> {
    await this.auth.signOut();
  }
}
