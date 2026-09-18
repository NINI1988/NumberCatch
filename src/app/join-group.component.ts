import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `<section class="page narrow">
    <p class="eyebrow">GRUPPENEINLADUNG</p>
    <h1>Gruppe beitreten</h1>
    @if (!error() && !joined()) {
      <p class="muted">Du wurdest zu einer NumberCatch-Gruppe eingeladen.</p>
    }
    @if (joined()) {
      <p class="success">Du bist der Gruppe beigetreten.</p>
    }
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (!joined() && !error()) {
      <button class="primary full" (click)="join()">Gruppe beitreten</button>
    }
    @if (joined() || error()) {
      <a routerLink="/friends" class="secondary full link-button">Zu Freunde</a>
    }
  </section>`,
})
export class JoinGroupComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  readonly joined = signal(false);
  readonly error = signal('');
  private token = '';
  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!this.token) this.error.set('Einladungslink ist ungültig.');
  }
  async join(): Promise<void> {
    const userId = this.auth.profile()?.id;
    if (!userId || !this.token) return;
    try {
      await this.supabase.joinGroup(this.token, userId);
      this.joined.set(true);
    } catch {
      this.error.set('Einladung ist ungültig oder konnte nicht verwendet werden.');
    }
  }
}
