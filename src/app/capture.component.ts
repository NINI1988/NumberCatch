import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';
import { CaptureResult, GameService } from './game.service';
import { SyncService } from './sync.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: ` <section class="page narrow">
    <p class="eyebrow">NEUER FUND</p>
    <h1>Kennzeichen erfassen</h1>
    <p class="muted">
      Deine nächste Zahl ist <strong>{{ next() }}</strong
      >.
    </p>
    <form (ngSubmit)="submit()">
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
      <button class="primary full" type="submit" [disabled]="saving()" [attr.aria-busy]="saving()">
        <span *ngIf="saving()" class="loading-spinner" aria-hidden="true"></span>
        {{ saving() ? 'Speichern…' : 'Speichern' }}
      </button>
    </form>
    <div *ngIf="saveMessage()" class="result-card good">
      <h2>{{ saveMessage() }}</h2>
    </div>
    <div *ngIf="result() as found" class="result-card">
      <h2>{{ message(found) }}</h2>
      <p>{{ description(found) }}</p>
    </div>
  </section>`,
})
export class CaptureComponent implements OnInit {
  private readonly game = inject(GameService);
  private readonly auth = inject(AuthService);
  private readonly sync = inject(SyncService);
  private readonly route = inject(ActivatedRoute);
  readonly result = signal<CaptureResult | null>(null);
  readonly saveMessage = signal('');
  readonly saving = signal(false);
  readonly locationStatus = signal('Standort wird beim Speichern erfasst.');
  number: number | null = null;
  note = '';
  private position: GeolocationPosition | null = null;
  ngOnInit(): void {
    const routeNumber = Number(this.route.snapshot.queryParamMap.get('number'));
    if (Number.isInteger(routeNumber) && routeNumber >= 1 && routeNumber <= 999) {
      this.number = routeNumber;
    }
  }
  next(): number {
    return (this.auth.profile()?.current_number ?? 0) + 1;
  }
  async submit(): Promise<void> {
    if (!this.number || this.saving()) return;
    const number = this.number;
    this.saveMessage.set('');
    const result = this.game.classify(this.auth.profile()?.current_number ?? 0, number);
    if (result.kind === 'done') {
      this.result.set(result);
      return;
    }
    this.saving.set(true);
    try {
      this.locationStatus.set('Standort wird erfasst …');
      await this.capturePosition();
      this.locationStatus.set('Fund wird gespeichert …');
      this.game.enqueue({
        number,
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
      this.saveMessage.set(
        result.kind === 'next'
          ? `${result.number} gespeichert – dein Fortschritt wurde erhöht.`
          : `${result.number} wurde als private Vormerkung gespeichert.`,
      );
      this.result.set(null);
      this.locationStatus.set('Gespeichert – wird synchronisiert, sobald Netz verfügbar ist.');
      this.number = null;
      this.note = '';
    } finally {
      this.saving.set(false);
    }
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
  private capturePosition(): Promise<void> {
    if (this.position || !navigator.geolocation) return Promise.resolve();
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.position = position;
          this.locationStatus.set('Standort erfasst.');
          resolve();
        },
        () => {
          this.locationStatus.set(
            'Standort nicht verfügbar – Fund kann trotzdem gespeichert werden.',
          );
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }
}
