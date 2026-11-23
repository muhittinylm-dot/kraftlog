# KRAFTLOG 2.1 – Update: Vorschläge für Gewichte & Wiederholungen

Dieses Update ergänzt die vorhandene KRAFTLOG-App um **Werte vom letzten Training**. Es ist für das bestehende GitHub-Repository **muhittinylm-dot/kraftlog** vorbereitet.

## Was ist neu?

- Wird eine Übung an einem **späteren Datum** erneut gewählt, erscheinen die zuletzt tatsächlich erfassten Gewichte und Wiederholungen als grüne Vorschläge direkt in den Eingabefeldern.
- Tippe auf **✓ neben einem Satz**, um Gewicht und Wiederholungen aus dem letzten passenden Satz zu übernehmen. Bereits selbst eingetragene Werte bleiben erhalten; nur leere Felder werden ergänzt.
- Tippe unter einem einzelnen Feld auf **↳ 45 kg** oder **↳ 12 Wdh.**, um nur diesen Wert zu übernehmen. Du kannst diese beiden Felder unabhängig voneinander ändern.
- Tippe auf **✓ Alle letzten Sätze übernehmen**, um alle letzten Werte einzusetzen, auch wenn es beim letzten Mal mehr als drei Sätze waren. Bereits von dir eingetragene Werte werden **nicht überschrieben**.
- Du kannst selbstverständlich **immer direkt in ein Eingabefeld tippen** und den vorgeschlagenen Wert durch einen eigenen ersetzen.

**Wichtig:** Grüne Vorschläge sind zunächst nur Vorschläge. Sie zählen erst nach Übernahme oder eigener Eingabe als Training. Das Volumen wird aus tatsächlich eingetragenen, vollständigen Sätzen berechnet.

## Bestehende App aktualisieren – iPhone und GitHub

Du musst **kein neues Repository**, **keine neue Firebase-Datenbank** und **kein neues Benutzerkonto** anlegen.

1. Lade **KRAFTLOG-2.1-UPDATE.zip** herunter und öffne die Datei in der iPhone-App **Dateien**. Durch Antippen entpackt iOS sie in einen Ordner.
2. Öffne im Browser GitHub: https://github.com/muhittinylm-dot/kraftlog/upload/main . Melde dich an, falls nötig. Falls der Upload auf dem Handy nicht sichtbar ist, fordere über die Browseroptionen die **Desktop-Website** an.
3. Tippe auf **choose your files / Dateien auswählen** und wähle die **vier Dateien direkt aus dem entpackten Ordner** aus: `index.html`, `app.js`, `app.css` und `sw.js`. **Nicht die ZIP-Datei hochladen!**
4. Achte darauf, dass GitHub die Dateien **im Hauptverzeichnis des vorhandenen Repositories** ersetzt, nicht in einem Unterordner. Unter den Dateinamen sollten Änderungen an vier bestehenden Dateien erkennbar sein.
5. Tippe auf **Commit changes**. Damit wird GitHub Pages automatisch neu veröffentlicht. Du musst unter Settings → Pages nichts ändern.
6. Öffne deine bisherige App unter https://muhittinylm-dot.github.io/kraftlog/ . Falls du noch die alte Ansicht siehst, lade die Seite neu, schließe die Web-App ganz und öffne sie erneut. Offline genutzte Geräte benötigen zum Update eine Internetverbindung.
7. **Entsperre dein bisheriges Profil**, prüfe deine alten Trainingseinträge und – falls Firebase aktiviert ist – unter **Profil** den Synchronisierungsstatus.

## Wichtig: So bleiben die Daten erhalten

- **Die GitHub-Pages-Adresse bleibt gleich.** Es werden nur vier Code-Dateien ausgetauscht. Die lokale Datenkennung `kraftlog.profiles.v1`, das Datenformat und die Firebase-Synchronisierung werden nicht geändert.
- **Nicht** das GitHub-Repository löschen oder umbenennen, **nicht** deine Browserdaten löschen und **nicht** das Profil neu erstellen.
- **Die Datei `cloud-config.js` NICHT überschreiben.** Sie bleibt, wie sie in deinem bestehenden Repository hinterlegt ist. Genau deshalb enthält das Update-ZIP ausschließlich vier Dateien.
- Öffne die App weiter über denselben Browser oder dieselbe installierte Web-App. Andere Browser können zunächst andere lokale Daten anzeigen. Eine erfolgreich eingerichtete Cloud-Synchronisierung ermöglicht die Wiederherstellung.
- Ein lokaler Browser kann Daten trotzdem verlieren. Die Cloud schützt nur, wenn dein Profil wirklich verbunden ist und die App den erfolgreichen Sync bestätigt. Ein zusätzlicher verschlüsselter Export vor größeren Änderungen ist optional sinnvoll.

## Beispiel

Am 19.11. hast du am Latzug **50 kg × 8**, **45 kg × 12** und **55 kg × 7** trainiert. Am 21.11. wählst du wieder Latzug. Die drei Paare stehen grün als Vorschlag. Du kannst z. B. beim zweiten Satz das Gewicht auf **47,5 kg** ändern und **12 Wiederholungen** übernehmen. Die neuen Satzwerte fließen erst nach dem Eintragen/Übernehmen in deine Statistik.

## Hinweise

Version 2.1 wurde anhand von simulierten Nutzerinteraktionen im mobilen Chromium geprüft: Übernahme pro Feld, pro Satz und aller Sätze, keine Überschreibung eigener Gewichte, Volumenberechnung und Wiederöffnung eines verschlüsselten Profils. Der Browsertest verwendet simulierte Kryptografie und keinen echten Firebase-Server; die bestehende Verschlüsselungs- und Cloud-Implementierung wurde nicht verändert. Die Veröffentlichung und der Cloud-Abgleich in deinem eigenen GitHub-/Firebase-Konto wurden nicht ausgeführt.
