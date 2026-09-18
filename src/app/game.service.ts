import { Injectable } from '@angular/core';
import { PendingSighting, Sighting } from './models';

export type CaptureResult = { kind: 'next' | 'hint' | 'done'; number: number; nextNumber: number };
export function classifyCapture(currentNumber: number, number: number): CaptureResult {
  if (number <= currentNumber) return { kind: 'done', number, nextNumber: currentNumber + 1 };
  if (number === currentNumber + 1) return { kind: 'next', number, nextNumber: number + 1 };
  return { kind: 'hint', number, nextNumber: currentNumber + 1 };
}

@Injectable({ providedIn: 'root' })
export class GameService {
  classify(currentNumber: number, number: number): CaptureResult {
    return classifyCapture(currentNumber, number);
  }
  queueKey = 'number-catch-pending';
  pending(): PendingSighting[] {
    try {
      const items = JSON.parse(localStorage.getItem(this.queueKey) ?? '[]') as Array<
        Partial<PendingSighting>
      >;
      return items.map((item) => ({ ...item, type: item.type ?? 'hint' }) as PendingSighting);
    } catch {
      return [];
    }
  }
  enqueue(sighting: Omit<PendingSighting, 'client_id'>): PendingSighting {
    const item = { ...sighting, client_id: crypto.randomUUID() };
    localStorage.setItem(this.queueKey, JSON.stringify([...this.pending(), item]));
    return item;
  }
  remove(clientId: string): void {
    localStorage.setItem(
      this.queueKey,
      JSON.stringify(this.pending().filter((item) => item.client_id !== clientId)),
    );
  }
  async confirmCapture(
    userId: string,
    currentNumber: number,
    number: number,
    position: GeolocationPosition | null,
    note: string,
    save: (sighting: Omit<Sighting, 'id' | 'user_id' | 'type'>) => Promise<void>,
  ): Promise<CaptureResult> {
    const result = this.classify(currentNumber, number);
    if (result.kind !== 'next') return result;
    await save({
      number,
      latitude: position?.coords.latitude ?? null,
      longitude: position?.coords.longitude ?? null,
      accuracy: position?.coords.accuracy ?? null,
      note: note || null,
      created_at: new Date().toISOString(),
    });
    return result;
  }
}
