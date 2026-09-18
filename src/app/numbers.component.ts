import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { GameService } from './game.service';

@Component({
  standalone: true,
  imports: [RouterLink],
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
export class NumbersComponent {
  private readonly auth = inject(AuthService);
  private readonly game = inject(GameService);
  readonly current = signal(0);
  readonly numbers = Array.from({ length: 999 }, (_, index) => index + 1);
  next(): number {
    return this.current() + 1;
  }
  initials(): string {
    return (this.auth.profile()?.display_name ?? 'Du').slice(0, 2).toUpperCase();
  }
}
