# NumberCatch

Mobile-first Angular-PWA für die gemeinsame Suche nach Autonummern in aufsteigender Reihenfolge. Der MVP nutzt Supabase Auth/Postgres/Realtime-fähige Tabellen und MapLibre. Funde werden bei bestehender Internetverbindung direkt in Supabase gespeichert.

## Live-App

[NumberCatch auf GitHub Pages öffnen](https://nini1988.github.io/NumberCatch/)

## Lokal starten

```sh
npm ci
npm start
```

Die öffentliche Supabase-URL und der Publishable Key stehen in den Angular-Environment-Dateien. Im Frontend darf ausschließlich der öffentliche Publishable Key verwendet werden.

## Supabase

1. Neues Supabase-Projekt anlegen.
2. `supabase/migrations/20260918000000_initial.sql` im SQL Editor ausführen.
3. E-Mail-Auth aktivieren und die Site URL auf die GitHub-Pages-URL setzen.
4. Realtime ist für Profile, Sightings und Gruppenmitgliedschaften in der Migration aktiviert.

Die RLS-Policies erlauben private Sightings nur ihrem Ersteller; Gruppenprofile werden nur über gemeinsame Gruppen sichtbar. Vollständige Kennzeichen werden nicht gespeichert.

Die zusätzliche Migration `20260918000001_groups_and_avatars.sql` legt den öffentlichen Avatar-Bucket mit benutzerspezifischen Upload-Policies an und korrigiert die Gruppen-RLS-Abfragen.

## GitHub Pages

1. In `Settings → Pages` die Quelle `GitHub Actions` wählen.
2. Nach dem ersten erfolgreichen Deployment ist die App unter [nini1988.github.io/NumberCatch](https://nini1988.github.io/NumberCatch/) erreichbar.
3. In Supabase unter `Authentication → URL Configuration` diese URL als Site URL und als erlaubte Redirect-URL eintragen: `https://nini1988.github.io/NumberCatch/`.

Der Workflow baut mit dem Repository-Namen als `base-href` und verwendet Hash-Routing. Für dieses Repository wird dadurch automatisch `/NumberCatch/` verwendet.

Kamera/OCR ist über eine spätere `RecognitionService`-Implementierung ergänzbar; der MVP erfasst Zahlen manuell und speichert sie direkt in Supabase.
