import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { GameService, visibleNumberLimit } from './game.service';
import { Profile } from './models';
import { SupabaseService } from './supabase.service';
import { LucideCheck } from '@lucide/angular';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, LucideCheck],
  template: `<section class="page">
    <div class="page-heading numbers-heading">
      <p class="eyebrow">DEIN FORTSCHRITT</p>
    </div>
    <a routerLink="/capture" [queryParams]="{ number: next() }" class="next-card"
      ><span class="next-label">NÄCHSTE ZAHL</span><span class="next-number">{{ next() }}</span
      ><span>Jetzt erfassen →</span></a
    >
    <div class="section-title">
      <h2>Zahlenübersicht</h2>
      <span class="muted">1–{{ numberLimit() }}</span>
    </div>
    <div class="number-grid">
      @for (number of numbers(); track number) {
        <div
          class="number-cell"
          [class.completed]="number <= current()"
          [class.next-cell]="number === next()"
        >
          <span class="number-label">{{ number }}</span>
          <div class="number-players" *ngIf="playersAt(number) as players">
            <span class="number-player" *ngFor="let player of players">
              <button
                type="button"
                class="number-avatar"
                [class.own-avatar]="player.id === profile()?.id"
                [attr.aria-label]="player.display_name"
                [style.background-image]="
                  player.avatar_url ? 'url(' + player.avatar_url + ')' : null
                "
              >
                {{ player.avatar_url ? '' : initials(player.display_name) }}
              </button>
              <span class="player-name">{{ player.display_name }}</span>
            </span>
          </div>
          @if (number === next()) {
            <small>gesucht</small>
          }
          @if (number <= current()) {
            <svg class="check" lucideCheck></svg>
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
  readonly profile = computed(() => this.auth.profile());
  readonly current = computed(() => this.auth.profile()?.current_number ?? 0);
  readonly friends = signal<Profile[]>([]);
  readonly numberLimit = computed(() =>
    visibleNumberLimit(
      this.current(),
      this.friends().map((friend) => friend.current_number),
    ),
  );
  readonly numbers = computed(() =>
    Array.from({ length: this.numberLimit() }, (_, index) => index + 1),
  );
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
  playersAt(number: number): Profile[] {
    const ownProfile = this.profile();
    const players = ownProfile ? [ownProfile, ...this.friends()] : this.friends();
    return players.filter((player) => player.current_number === number);
  }
}
