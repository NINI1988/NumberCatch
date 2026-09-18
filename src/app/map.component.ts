import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Sighting } from './models';
import { SupabaseService } from './supabase.service';
import maplibregl, { Map } from 'maplibre-gl';
import { environment } from '../environments/environment';

@Component({
  standalone: true,
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
  </section>`,
})
export class MapComponent implements AfterViewInit {
  @ViewChild('map', { static: true }) mapElement!: ElementRef<HTMLDivElement>;
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private map?: Map;
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
    const sightings: Sighting[] = await this.supabase.ownSightings(userId);
    for (const sighting of sightings)
      if (sighting.latitude !== null && sighting.longitude !== null)
        new maplibregl.Marker({ color: this.color(sighting.created_at) })
          .setLngLat([sighting.longitude, sighting.latitude])
          .setPopup(
            new maplibregl.Popup().setHTML(
              `<strong>${sighting.number}</strong><br>${new Date(sighting.created_at).toLocaleDateString('de-DE')}<br>${sighting.note ?? ''}`,
            ),
          )
          .addTo(this.map!);
  }
  private color(date: string): string {
    const days = (Date.now() - Date.parse(date)) / 86400000;
    return days <= 7 ? '#ef8354' : days <= 30 ? '#f2c14e' : '#829ab1';
  }
}
