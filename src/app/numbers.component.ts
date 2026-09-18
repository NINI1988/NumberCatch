import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { GameService } from './game.service';
import { Profile } from './models';
import { SupabaseService } from './supabase.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `<section class="page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">DEIN FORTSCHRITT</p>
        <h1>
          Du suchst gerade: <strong>{{ next() }}</strong>
        </h1>
      </div>
      <a routerLink="/profile" class="avatar">{{ initials() }}</a>
    </div>
    <a routerLink="/capture" class="next-card"
      ><span class="next-label">NÄCHSTE ZAHL</span><span class="next-number">{{ next() }}</span
      ><span>Jetzt erfassen →</span></a
    >
    <div class="section-title">
      <h2>Zahlenübersicht</h2>
      <span class="muted">1–999</span>
    </div>
    <div class="number-grid">
      @for (number of numbers; track number) {
        <div
          class="number-cell"
          [class.completed]="number <= current()"
          [class.next-cell]="number === next()"
        >
          <span>{{ number }}</span>
          <span class="number-avatars" *ngIf="friendsFor(number).length">
            <span
              *ngFor="let friend of friendsFor(number).slice(0, 3)"
              class="number-avatar"
              [title]="friend.display_name"
              [style.background-image]="friend.avatar_url ? 'url(' + friend.avatar_url + ')' : null"
              >{{ friend.avatar_url ? '' : initials(friend.display_name) }}</span
            >
          </span>
          @if (number === next()) {
            <small>gesucht</small>
          }
          @if (number <= current()) {
            <span class="check">✓</span>
          }
        </div>
      }
    </div>
  </section>`,
})
export class NumbersComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly game = inject(GameService);
  private readonly supabase = inject(SupabaseService);
  readonly current = signal(0);
  readonly friends = signal<Profile[]>([]);
  readonly numbers = Array.from({ length: 999 }, (_, index) => index + 1);
  async ngOnInit(): Promise<void> {
    const userId = this.auth.profile()?.id;
    if (!userId) return;
    try {
      const groups = await this.supabase.groups(userId);
      const members = (
        await Promise.all(groups.map((group) => this.supabase.members(group.id)))
      ).flat();
      this.friends.set(
        members.filter((member) => member.user_id !== userId).map((member) => member.profile),
      );
    } catch {
      /* The personal overview remains usable when friends are offline. */
    }
  }
  next(): number {
    return this.current() + 1;
  }
  initials(name = this.auth.profile()?.display_name ?? 'Du'): string {
    return name.slice(0, 2).toUpperCase();
  }
  friendsFor(number: number): Profile[] {
    return this.friends().filter((friend) => friend.current_number >= number);
  }
}
