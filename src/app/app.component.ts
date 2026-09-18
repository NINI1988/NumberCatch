import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';
import { SyncService } from './sync.service';
import {
  LucideGrid3x3,
  LucideMap,
  LucidePlus,
  LucideUserRound,
  LucideUsers,
} from '@lucide/angular';

@Component({
  selector: 'nc-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideGrid3x3,
    LucideMap,
    LucidePlus,
    LucideUserRound,
    LucideUsers,
  ],
  template: ` <div class="app-shell">
    <header class="topbar">
      <a routerLink="/numbers" class="brand"
        ><span class="brand-mark">№</span><span>NumberCatch</span></a
      ><a routerLink="/profile" class="avatar-small">{{ initials() }}</a>
    </header>
    <main><router-outlet /></main>
    <nav class="bottom-nav" aria-label="Hauptnavigation">
      <a routerLink="/numbers" routerLinkActive="active"><svg lucideGrid3x3></svg>Zahlen</a>
      <a routerLink="/map" routerLinkActive="active"><svg lucideMap></svg>Karte</a>
      <a routerLink="/capture" class="capture-link"><svg lucidePlus></svg>Erfassen</a>
      <a routerLink="/friends" routerLinkActive="active"><svg lucideUsers></svg>Freunde</a>
      <a routerLink="/profile" routerLinkActive="active"><svg lucideUserRound></svg>Profil</a>
    </nav>
  </div>`,
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly sync = inject(SyncService);
  ngOnInit(): void {
    this.sync.listen();
    void this.initialize();
  }
  private async initialize(): Promise<void> {
    await this.auth.initialize();
    await this.sync.flush();
  }
  initials(): string {
    const name = this.auth.profile()?.display_name ?? '?';
    return name.slice(0, 2).toUpperCase();
  }
}
