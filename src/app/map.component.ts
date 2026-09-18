import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import maplibregl, { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { AuthService } from './auth.service';
import { Sighting } from './models';
import { SupabaseService } from './supabase.service';
import { environment } from '../environments/environment';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `<section class="page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">PRIVATE KARTE</p>
        <h1>Deine Vormerkungen</h1>
      </div>
    </div>
    <div #map class="map"></div>
    <div class="map-legend">
      <span><i class="fresh"></i>aktuell</span><span><i class="old"></i>älter</span
      ><span><i class="stale"></i>veraltet</span>
    </div>
    <p class="muted map-note">Nur du siehst die GPS-Standorte deiner Vormerkungen.</p>
    <p class="error" *ngIf="loadError()">{{ loadError() }}</p>
    <div class="sighting-list" *ngIf="sightings().length; else noSightings">
      <h2>Vormerkungen</h2>
      <div
        class="sighting-row"
        *ngFor="let sighting of sightings()"
        (click)="focus(sighting)"
        role="button"
        tabindex="0"
        (keydown.enter)="focus(sighting)"
      >
        <span class="sighting-number">{{ sighting.number }}</span>
        <span class="sighting-details"
          ><strong>{{ ageLabel(sighting.created_at) }}</strong
          ><small
            >{{ sighting.created_at | date: 'dd.MM.yyyy, HH:mm' }} Uhr<span *ngIf="sighting.note">
              · {{ sighting.note }}</span
            ></small
          ></span
        >
        <button
          class="delete-button"
          type="button"
          (click)="remove(sighting, $event)"
          aria-label="Vormerkung löschen"
          title="Vormerkung löschen"
        >
          🗑
        </button>
      </div>
    </div>
    <ng-template #noSightings
      ><div class="empty-state compact">
        <h2>Noch keine Vormerkungen</h2>
        <p class="muted">Spätere Zahlen kannst du beim Erfassen vormerken.</p>
      </div></ng-template
    >
  </section>`,
})
export class MapComponent implements AfterViewInit {
  @ViewChild('map', { static: true }) mapElement!: ElementRef<HTMLDivElement>;
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private map?: MapLibreMap;
  private readonly markers = new Map<string, Marker>();
  readonly sightings = signal<Sighting[]>([]);
  readonly loadError = signal('');
  ngAfterViewInit(): void {
    this.map = new maplibregl.Map({
      container: this.mapElement.nativeElement,
      style: environment.mapStyleUrl,
      center: [10.45, 51.16],
      zoom: 5,
    });
    void this.load();
  }
  private async load(): Promise<void> {
    const userId = this.auth.profile()?.id;
    if (!userId) return;
    try {
      const sightings = await this.supabase.ownSightings(userId);
      this.sightings.set(sightings);
      for (const sighting of sightings) {
        if (sighting.latitude === null || sighting.longitude === null) continue;
        const marker = new maplibregl.Marker({ color: this.color(sighting.created_at) })
          .setLngLat([sighting.longitude, sighting.latitude])
          .setPopup(
            new maplibregl.Popup().setText(
              `${sighting.number} · ${this.ageLabel(sighting.created_at)}${sighting.note ? ` · ${sighting.note}` : ''}`,
            ),
          )
          .addTo(this.map!);
        this.markers.set(sighting.id, marker);
      }
    } catch (error) {
      this.loadError.set(
        error instanceof Error ? error.message : 'Vormerkungen konnten nicht geladen werden.',
      );
    }
  }
  focus(sighting: Sighting): void {
    if (sighting.latitude === null || sighting.longitude === null || !this.map) return;
    this.map.flyTo({ center: [sighting.longitude, sighting.latitude], zoom: 14 });
    this.markers.get(sighting.id)?.togglePopup();
  }
  async remove(sighting: Sighting, event: Event): Promise<void> {
    event.stopPropagation();
    if (!window.confirm(`Vormerkung ${sighting.number} wirklich löschen?`)) return;
    const userId = this.auth.profile()?.id;
    if (!userId) return;
    try {
      await this.supabase.deleteSighting(userId, sighting.id);
      this.markers.get(sighting.id)?.remove();
      this.markers.delete(sighting.id);
      this.sightings.update((items) => items.filter((item) => item.id !== sighting.id));
    } catch (error) {
      this.loadError.set(
        error instanceof Error ? error.message : 'Vormerkung konnte nicht gelöscht werden.',
      );
    }
  }
  ageLabel(date: string): string {
    const days = (Date.now() - Date.parse(date)) / 86400000;
    return days <= 7 ? 'Aktuell' : days <= 30 ? 'Älter' : 'Wahrscheinlich veraltet';
  }
  private color(date: string): string {
    const days = (Date.now() - Date.parse(date)) / 86400000;
    return days <= 7 ? '#ef8354' : days <= 30 ? '#f2c14e' : '#829ab1';
  }
}
