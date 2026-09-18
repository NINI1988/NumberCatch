import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { GameService } from './game.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly auth = inject(AuthService);
  private readonly game = inject(GameService);
  private readonly supabase = inject(SupabaseService);
  private syncing = false;
  async flush(): Promise<void> {
    const userId = this.auth.profile()?.id;
    if (!userId || this.syncing || !navigator.onLine) return;
    this.syncing = true;
    try {
      for (const item of this.game.pending()) {
        await this.supabase.saveSighting(userId, item);
        if (item.type === 'confirmed') await this.supabase.updateProgress(userId, item.number);
        this.game.remove(item.client_id);
      }
    } catch (error) {
      console.warn('NumberCatch sync postponed', error);
    } finally {
      this.syncing = false;
    }
  }
  listen(): void {
    window.addEventListener('online', () => void this.flush());
  }
}
