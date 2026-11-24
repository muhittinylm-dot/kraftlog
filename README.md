# KRAFTLOG 7.0 – Trainingslog mit Sicherheits-Härtung

Privates, mobil nutzbares Trainingslog für Krafttraining und Cardio, Trainingspläne, Fortschrittsstatistiken, Pace und einen wiederholbaren Pausentimer. Keine Booster-Packs, kein Mini-Gym, keine XP/Badges.

## Bereitstellung

Diese Dateien liegen direkt im Hauptverzeichnis von GitHub Pages: `index.html`, `app.css`, `app.js`, `cloud.js`, `cloud-config.js` (bestehende Firebase-Webkonfiguration), `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`. **Im Update-Paket liegt absichtlich keine `cloud-config.js`.** Die schon vorhandene Datei bleibt unverändert.

Ältere `mini-gym-world.js`-Dateien werden nicht mehr gebraucht und können im GitHub-Repository gelöscht werden. Keinesfalls vorhandene Profildaten oder den Browser-Speicher löschen.

## Sicherheitsarchitektur

- Lokale Profile werden mit AES-GCM (256 Bit) verschlüsselt.
- Schlüsselableitung: PBKDF2-HMAC-SHA-256 mit individuellem Salt, für neue Profile/Passwortwechsel 600.000 Iterationen. Alte Profile ohne Iterationsfeld bleiben bei 240.000 Iterationen kompatibel.
- Firebase Authentication verifiziert Cloud-Logins. Ein angemeldeter Cloud-Nutzer erhält nur Zugriff auf `kraftlog_users/{eigene uid}`, vorausgesetzt die beigelegten Firestore-Regeln wurden in Firebase veröffentlicht.
- Cloud-Payloads enthalten verschlüsselte Profile. Firebase-Refresh-Tokens werden in der laufenden Sitzung gehalten und für die langfristige Wiederherstellung unter dem jeweiligen lokalen Profilpasswort AES-GCM-verschlüsselt abgelegt.
- Eine Meta-CSP erlaubt nur die eigenen Skripte und ausschließlich erforderliche Firebase-Verbindungen. Sie ist gegenüber einem serverseitigen CSP-HTTP-Header eingeschränkt.
- GitHub Pages stellt Dateien öffentlich bereit. `cloud-config.js` enthält nur Firebase-Webkonfiguration, niemals Admin-Credentials, Service-Account-Schlüssel oder private Tokens.
- Rate-Limit in der lokalen Oberfläche ist nur eine Komfort-/Missbrauchsbremse und schützt **nicht** vor Angriffen gegen Firebase. Die produktiven Limits müssen auf Firebase-/Google-Seite gelten.

## Firebase einrichten

1. Firebase Console > Authentifizierung: E-Mail/Passwort aktivieren; unnötige Anmeldemethoden deaktivieren.
2. Firebase Console > Firestore Database > Regeln: Inhalte aus der separat gelieferten `FIRESTORE-REGELN.txt` einfügen, prüfen und veröffentlichen. Diese Datei NICHT nur nach GitHub hochladen.
3. Google Cloud Console > APIs und Dienste > Anmeldedaten: Firebase-Web-API-Schlüssel auf die tatsächlich benötigten APIs und – soweit möglich – auf deine Website einschränken. Einschränkungen vorsichtig testen, um Cloud-Login nicht auszusperren.
4. Nutzung/Kontingente von Firebase Authentication und Firestore beobachten. Unbenutzte Datenbank-/Storage-Dienste geschlossen halten.

## Hinweise

Bei Passwortänderung auf einem Gerät muss ein anderes Gerät, das noch den alten Verschlüsselungsschlüssel hat, gegebenenfalls mit dem **neuen** Passwort bzw. über die Cloud-Wiederherstellung neu verbunden werden. Nicht auf dem zweiten Gerät manuell überschreiben, solange die Stände ungeklärt sind.

Bitte die ausführliche `SICHERHEITS-AUDIT.md` und `UPDATE-ANLEITUNG.md` beachten.
