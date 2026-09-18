import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { CaptureResult, GameService } from './game.service';
import { SyncService } from './sync.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: ` <section class="page narrow">
    <a routerLink="/numbers" class="back-link">← Zahlen</a>
    <p class="eyebrow">NEUER FUND</p>
    <h1>Kennzeichen erfassen</h1>
    <p class="muted">
      Deine nächste Zahl ist <strong>{{ next() }}</strong
      >.
    </p>
    <form (ngSubmit)="check()">
      <div class="big-label">
        Welche Zahl hast du gesehen?<input
          class="number-input"
          type="number"
          min="1"
          max="999"
          name="number"
          [(ngModel)]="number"
          required
          inputmode="numeric"
        />
      </div>
      <label
        >Notiz (optional)<textarea
          name="note"
          [(ngModel)]="note"
          rows="2"
          placeholder="z. B. Parkplatz am Bahnhof"
        ></textarea>
      </label>
      <div class="location-status">{{ locationStatus() }}</div>
      <button class="primary full" type="submit">Prüfen</button>
    </form>
    <div *ngIf="result() as found" class="result-card" [class.good]="found.kind === 'next'">
      <h2>{{ message(found) }}</h2>
      <p>{{ description(found) }}</p>
      <button *ngIf="found.kind !== 'done'" class="primary full" (click)="confirm(found)">
        {{ found.kind === 'next' ? 'Fortschritt bestätigen' : 'Vormerkung speichern' }}
      </button>
    </div>
  </section>`,
})
export class CaptureComponent {
  private readonly game = inject(GameService);
  private readonly auth = inject(AuthService);
  private readonly sync = inject(SyncService);
  readonly result = signal<CaptureResult | null>(null);
  readonly locationStatus = signal('Standort wird beim Speichern erfasst.');
  number: number | null = null;
  note = '';
  private position: GeolocationPosition | null = null;
  next(): number {
    return (this.auth.profile()?.current_number ?? 0) + 1;
  }
  check(): void {
    if (!this.number) return;
    this.result.set(this.game.classify(this.auth.profile()?.current_number ?? 0, this.number));
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.position = position;
          this.locationStatus.set('Standort erfasst.');
        },
        () =>
          this.locationStatus.set(
            'Standort nicht verfügbar – Fund kann trotzdem gespeichert werden.',
          ),
      );
  }
  message(result: CaptureResult): string {
    return result.kind === 'next'
      ? `${result.number} ist deine nächste Zahl!`
      : result.kind === 'hint'
        ? `${result.number} vormerken?`
        : `${result.number} ist schon erledigt.`;
  }
  description(result: CaptureResult): string {
    return result.kind === 'next'
      ? `Damit steigt dein Fortschritt auf ${result.number}.`
      : result.kind === 'hint'
        ? 'Der Fund wird als private Vormerkung gespeichert.'
        : 'Diese Zahl ist bereits abgeschlossen.';
  }
  async confirm(result: CaptureResult): Promise<void> {
    if (!this.number || result.kind === 'done') return;
    this.game.enqueue({
      number: this.number,
      type: result.kind === 'next' ? 'confirmed' : 'hint',
      latitude: this.position?.coords.latitude ?? null,
      longitude: this.position?.coords.longitude ?? null,
      accuracy: this.position?.coords.accuracy ?? null,
      note: this.note || null,
      created_at: new Date().toISOString(),
    });
    if (result.kind === 'next') {
      const profile = this.auth.profile();
      if (profile) this.auth.profile.set({ ...profile, current_number: result.number });
    }
    await this.sync.flush();
    this.result.set(null);
    this.locationStatus.set('Gespeichert – wird synchronisiert, sobald Netz verfügbar ist.');
    this.number = null;
  }
}
