# NumberCatch

Mobile-first Angular-PWA für die gemeinsame Suche nach Autonummern in aufsteigender Reihenfolge. Der MVP nutzt Supabase Auth/Postgres/Realtime-fähige Tabellen, MapLibre und eine kleine lokale Offline-Warteschlange.

## Lokal starten

```sh
npm ci
npm start
```

Lege die Supabase-Werte in `src/environments/environment.ts` (lokal, nicht committen) und `environment.prod.ts` für einen Produktionsbuild. Im Frontend darf ausschließlich der öffentliche `anon`-Key verwendet werden.

## Supabase

1. Neues Supabase-Projekt anlegen.
2. `supabase/migrations/20260918000000_initial.sql` im SQL Editor ausführen.
3. E-Mail-Auth aktivieren und die Site URL auf die GitHub-Pages-URL setzen.
4. Optional Realtime für die Tabellen in der Migration aktivieren.

Die RLS-Policies erlauben private Sightings nur ihrem Ersteller; Gruppenprofile werden nur über gemeinsame Gruppen sichtbar. Vollständige Kennzeichen werden nicht gespeichert.

Die zusätzliche Migration `20260918000001_groups_and_avatars.sql` legt den öffentlichen Avatar-Bucket mit benutzerspezifischen Upload-Policies an und korrigiert die Gruppen-RLS-Abfragen. Offline-Funde werden nach Login bzw. bei wiederhergestellter Verbindung automatisch synchronisiert.

## GitHub Pages

In den Repository Settings unter Pages die Quelle `GitHub Actions` wählen. Setze `NG_APP_SUPABASE_URL` als Repository Variable und `NG_APP_SUPABASE_ANON_KEY` als Repository Secret. Der Workflow baut mit dem Repository-Namen als `base-href` und verwendet Hash-Routing.

Kamera/OCR ist über eine spätere `RecognitionService`-Implementierung ergänzbar; der MVP erfasst Zahlen manuell und speichert Offline-Funde lokal, bis eine Sync-Anbindung verfügbar ist.
