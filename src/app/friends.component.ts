import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { GroupMember, PlayerGroup } from './models';
import { SupabaseService } from './supabase.service';
import { LucideUsers } from '@lucide/angular';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, LucideUsers],
  template: `<section class="page">
    <p class="eyebrow">DEINE GRUPPE</p>
    <h1>Freunde</h1>
    <div class="group-actions">
      <input
        [(ngModel)]="groupName"
        placeholder="Neue Gruppe"
        aria-label="Name der neuen Gruppe"
      /><button class="primary" (click)="create()">Erstellen</button>
    </div>
    <div class="group-actions">
      <input
        [(ngModel)]="groupId"
        placeholder="Gruppen-ID zum Beitreten"
        aria-label="Gruppen-ID"
      /><button class="secondary" (click)="join()">Beitreten</button>
    </div>
    <p class="error" *ngIf="error()">{{ error() }}</p>
    <div class="group-list" *ngIf="groups().length; else empty">
      <button
        *ngFor="let group of groups()"
        class="group-tab"
        [class.selected]="selected()?.id === group.id"
        (click)="select(group)"
      >
        {{ group.name }}
      </button>
    </div>
    <div class="invite-actions" *ngIf="selected()">
      <button class="secondary" (click)="copyGroupLink()">Gruppenlink kopieren</button>
      <input
        *ngIf="inviteUrl()"
        [value]="inviteUrl()"
        readonly
        aria-label="Einladungslink"
        (click)="$event.stopPropagation()"
      />
    </div>
    <p class="success" *ngIf="inviteMessage()">{{ inviteMessage() }}</p>
    <ng-template #empty
      ><div class="empty-state">
        <svg class="empty-icon" lucideUsers></svg>
        <h2>Noch keine Gruppe</h2>
        <p class="muted">Erstelle eine Gruppe oder tritt mit einer Gruppen-ID bei.</p>
      </div></ng-template
    >
    <div class="member-list" *ngIf="selected()">
      <p class="muted group-summary">
        {{ members().length }} {{ members().length === 1 ? 'Mitglied' : 'Mitglieder' }}
      </p>
      <div class="member-row" *ngFor="let member of members()">
        <div
          class="avatar"
          [style.background-image]="
            member.profile.avatar_url ? 'url(' + member.profile.avatar_url + ')' : null
          "
        >
          {{ member.profile.avatar_url ? '' : initials(member.profile.display_name) }}
        </div>
        <div>
          <strong>{{ member.profile.display_name }}</strong
          ><small class="muted">{{ member.profile.current_number }} abgeschlossen</small>
        </div>
      </div>
    </div>
  </section>`,
})
export class FriendsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  readonly groups = signal<PlayerGroup[]>([]);
  readonly members = signal<GroupMember[]>([]);
  readonly selected = signal<PlayerGroup | null>(null);
  readonly error = signal('');
  groupName = '';
  groupId = '';
  readonly inviteUrl = signal('');
  readonly inviteMessage = signal('');
  private stopRealtime?: () => void;
  async ngOnInit(): Promise<void> {
    await this.load();
  }
  async load(): Promise<void> {
    const userId = this.auth.profile()?.id;
    if (!userId) return;
    try {
      const groups = await this.supabase.groups(userId);
      this.groups.set(groups);
      if (groups.length) await this.select(groups[0]);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Gruppen konnten nicht geladen werden.',
      );
    }
  }
  async create(): Promise<void> {
    const userId = this.auth.profile()?.id;
    if (!userId || !this.groupName.trim()) return;
    try {
      await this.supabase.createGroup(userId, this.groupName);
      this.groupName = '';
      await this.load();
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Gruppe konnte nicht erstellt werden.',
      );
    }
  }
  async join(): Promise<void> {
    const userId = this.auth.profile()?.id;
    if (!userId || !this.groupId.trim()) return;
    try {
      await this.supabase.joinGroup(this.groupId.trim(), userId);
      this.groupId = '';
      await this.load();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Beitritt fehlgeschlagen.');
    }
  }
  async select(group: PlayerGroup): Promise<void> {
    this.selected.set(group);
    this.inviteUrl.set('');
    this.inviteMessage.set('');
    this.stopRealtime?.();
    this.stopRealtime = undefined;
    try {
      this.members.set(await this.supabase.members(group.id));
      this.stopRealtime = this.supabase.watchGroupProfiles(
        group.id,
        () => void this.refreshMembers(group.id),
      );
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Mitglieder konnten nicht geladen werden.',
      );
    }
  }
  async copyGroupLink(): Promise<void> {
    const group = this.selected();
    if (!group) return;
    try {
      const url = `${window.location.origin}${window.location.pathname}#/join/${group.id}`;
      this.inviteUrl.set(url);
      await navigator.clipboard?.writeText(url);
      this.inviteMessage.set('Einladungslink erstellt und kopiert.');
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Einladung konnte nicht erstellt werden.',
      );
    }
  }
  private async refreshMembers(groupId: string): Promise<void> {
    this.members.set(await this.supabase.members(groupId));
  }
  initials(name: string): string {
    return name.slice(0, 2).toUpperCase();
  }
}
