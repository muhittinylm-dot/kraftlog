# KRAFTLOG 2.0 – FitX-Trainingstagebuch, mit optionaler Cloud

**Kostenlos für private Nutzung: GitHub Pages + Firebase Spark (0 €).**  
Auf dem Handy nutzbar, ohne Werbung und ohne Abonnement. FitX ist nicht beteiligt.

## Die beiden Verbesserungen in Version 2.0

1. **Automatische Online-Synchronisierung:** Trainierte Übungen, Sätze, Gewichte, Pläne und Statistiken werden weiterhin zuerst auf deinem Gerät mit AES-GCM verschlüsselt. Sobald die optionale Firebase-Cloud einmal eingerichtet und dein Profil verbunden ist, wird derselbe verschlüsselte Stand zusätzlich online gespeichert. Beim Gerätewechsel kann er über E-Mail + Online-Passwort und anschließend das bisherige Profilpasswort wiederhergestellt werden. Deine Frau bekommt ihr **eigenes Online-Konto**, getrennt von deinen Daten.
2. **Updates ohne Datenverlust:** Der vorhandene lokale Speicherschlüssel `kraftlog.profiles.v1` wird weiter verwendet; alte Trainingseinträge werden nicht gelöscht oder neu angelegt. Die Service-Worker-Version ist aktualisiert und lädt neue App-Dateien bei Internetverbindung. Bleibt die GitHub-Pages-Adresse unverändert, bleiben die Browserdaten zugänglich. Nach einem erfolgreichen Cloud-Abgleich lassen sich Daten auch auf einem neuen Gerät wiederherstellen.

**Bitte beachten:** Cloud-Nutzung ist erst aktiv, wenn du die Firebase-Einrichtung unten durchgeführt hast. Nur die ZIP-Datei hochzuladen aktiviert die Cloud *noch nicht*. Auch eine Cloud ist keine unfehlbare Garantie gegen Datenverlust (z. B. Kontosperre, Anbieterfehler oder vergessenes Verschlüsselungspasswort). Manuelle Exporte bleiben deshalb optional verfügbar und sind als zusätzliche Absicherung sinnvoll.

## 1. GitHub Pages: Die neue App oder das Update veröffentlichen

**Wenn deine alte App schon online ist:** Verwende **exakt dasselbe GitHub-Repository und dieselbe Pages-Adresse**. GitHub Pages > Webseite aktualisieren: Lade die neuen Dateien in das Repository-Hauptverzeichnis hoch und überschreibe `index.html`, `app.js`, `app.css`, `sw.js`, beide Icon-Dateien, `manifest.webmanifest` und `cloud.js`. Lade zusätzlich einmal `firestore.rules` hoch. **Wenn `cloud-config.js` bereits mit echten Firebase-Werten gefüllt ist, überschreibe diese Datei beim Update NICHT durch die leere Vorlage.** Das gilt auch für künftige Updates.

**Wenn deine App noch nicht online ist:**

1. Auf dem Handy ZIP entpacken. Nur die Dateien aus dem Ordner hochladen, **nicht die ZIP-Datei**.
2. Auf https://github.com anmelden, ein **öffentliches** Repository, z. B. `kraftlog`, erstellen.
3. Im Repository **Add file > Upload files**, alle Dateien in das **Hauptverzeichnis** hochladen und committen.
4. In **Settings > Pages**: Source `Deploy from a branch`, Branch `main`, Folder `/(root)`, speichern.
5. Öffne `https://DEIN-NAME.github.io/kraftlog/`. Auf Wunsch in Safari/Chrome **Zum Home-Bildschirm** hinzufügen.

**Bei einem App-Update:** GitHub lädt den neuen Code unter demselben Link. Falls ein Gerät noch die alte Version zeigt, die Seite erneut laden oder die installierte Web-App einmal schließen und öffnen. **Nicht** „Website-Daten löschen“, die App deinstallieren oder das Repository umbenennen, um ein Update zu erzwingen.

## 2. Kostenlosen Firebase-Cloud-Dienst aktivieren (einmal durch dich)

Firebase ist **nicht** dasselbe wie GitHub Pages. GitHub hostet die App, Firebase speichert die verschlüsselten Trainingsdaten und verwaltet die Nutzer-Logins.

1. Öffne https://console.firebase.google.com/ und erstelle ein Firebase-Projekt. Wähle den **kostenlosen Spark-Tarif**; keinen kostenpflichtigen Blaze-Tarif, keine Rechnungskontoverknüpfung.
2. Wähle im Projekt **Authentication → Sign-in method** und aktiviere die Anmeldemethode **Email/Password** (E-Mail/Passwort).
3. Öffne **Firestore Database → Create database**. Erstelle die **Standard-Datenbank** (`(default)`) in einer für dich geeigneten europäischen Region. Verwende danach sichere Regeln, auch falls beim Erstellen der Testmodus angeboten wird.
4. Öffne in Firestore den Tab **Rules (Regeln)** und ersetze den gesamten Inhalt durch den Inhalt der mitgelieferten Datei **`firestore.rules`**. Klicke **Publish / Veröffentlichen**. **Das ist sicherheitskritisch.** Ohne diese Regeln solltest du keinerlei Trainingsdaten hochladen.
5. Öffne **Project settings → General → Your apps**, registriere eine **Web-App** (Symbol `</>`), z. B. `KRAFTLOG`. Kopiere aus der `firebaseConfig` die Werte für `apiKey` und `projectId`.
6. Öffne in deinem GitHub-Repository **`cloud-config.js` → Edit (Stift)**. Ersetze die leeren Zeichenketten durch deine beiden Werte, etwa so:

```js
window.KRAFTLOG_CLOUD_CONFIG = {
  apiKey: 'DEIN_FIREBASE_WEB_API_KEY',
  projectId: 'dein-firebase-projektname'
};
```

7. **Commit changes**, lade die GitHub-Pages-App neu. Unter **Profil → Cloud-Synchronisierung** erscheint nun die Online-Anmeldung.

Du darfst nur die **Web-Konfigurationswerte** `apiKey` und `projectId` eintragen. Diese Kennungen sind bei Firebase öffentlich verwendbar, **wenn** die Sicherheitsregeln stimmen. **Niemals** ein Firebase-Dienstkonto, einen Admin-Schlüssel oder private Schlüssel in GitHub hochladen.

**So sehen die Datenbank-Regeln aus (dieselben stehen in `firestore.rules`):**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /kraftlog_users/{userId} {
      allow read, create, update, delete:
        if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 3. Bestehende Trainingsdaten übernehmen

**Auf dem Handy, auf dem dein Training bisher gespeichert ist:**

1. Öffne unter **derselben GitHub-Pages-Adresse** KRAFTLOG 2.0 und entsperre dein bisheriges lokales Profil. Alle alten Trainingseinträge sollten sofort sichtbar sein.
2. Gehe auf **Profil → Cloud-Synchronisierung**, gib deine E-Mail und ein Online-Passwort ein und tippe auf **Cloud-Konto erstellen**.
3. Sobald die Anzeige **„Synchronisiert“** meldet, ist dein bisheriger verschlüsselter Trainingsstand auch online. Spätere Änderungen werden automatisch nach kurzer Zeit synchronisiert, sofern Internet verfügbar ist.
4. Deine Frau öffnet denselben App-Link auf **ihrem** Handy, erstellt **ihr eigenes lokales Profil** und verbindet es mit **ihrer eigenen E-Mail-Adresse**. Eure Trainingsdaten und Logins bleiben getrennt.

Du hast zwei Passwörter: Das **Profilpasswort** verschlüsselt und entschlüsselt dein Training; das **Online-Passwort** gehört zu Firebase Authentication. Du kannst dasselbe sichere Passwort verwenden, sofern du das möchtest, aber für erhöhte Sicherheit sind unterschiedliche Passwörter besser. **Wenn das Profilpasswort vergessen wird, sind auch die Cloud-Daten nicht entschlüsselbar.**

## 4. Neues Handy, keine Backup-Datei mehr nötig

1. Öffne auf dem neuen Handy dieselbe GitHub-Pages-Adresse.
2. Unten auf dem Startbildschirm unter **„Online-Profil wiederherstellen“** mit **E-Mail + Online-Passwort** anmelden.
3. Die App lädt dein verschlüsseltes Profil von Firebase in den lokalen Speicher.
4. Mit deinem **bisherigen Profilpasswort** entsperren. Alle Einträge und Pläne sind wieder da.

**Synchronisierung beachten:** Ohne Internet kannst du weiterhin lokal trainieren. Die App synchronisiert bei erneuter Verbindung, wenn du sie öffnest oder nach einer Änderung. Bei einem Versionskonflikt (auf zwei Geräten wurde derselbe Stand unterschiedlich bearbeitet) wird **nicht stillschweigend überschrieben**. Unter **Profil** wählst du ausdrücklich, welche Version beibehalten wird. Eine Zusammenführung widersprüchlicher Einträge erfolgt noch nicht automatisch.

## 5. Updates der App – ohne Löschung der Trainingsdaten

- Ändere ausschließlich die **Code-Dateien in GitHub**, nicht die Browserdaten und nicht das gespeicherte Online-Profil.
- **Behalte die bisherige GitHub-Pages-Adresse und das Firebase-Projekt.** Ein anderer GitHub-Nutzername oder Repositoryname verändert die Webadresse; lokaler Browserspeicher ist origin-gebunden.
- **Behalte die ausgefüllte `cloud-config.js`** bei späteren Updates. Die mitgelieferte leere Datei darf sie nicht überschreiben.
- Die lokale Speicherstruktur ist abwärtskompatibel zu KRAFTLOG 1.0.
- Prüfe nach Änderungen unter **Profil**, ob „Synchronisiert“ erscheint. Wenn nicht, trainierst du zwar weiterhin lokal, aber nicht garantiert cloudgesichert.

## 6. Sicherheit, Grenzen und Kosten

- Die Nutzer-Trainingsdaten liegen **nicht in GitHub**. Das öffentliche Repository enthält die Web-App, die beiden öffentlichen Firebase-Projektkennungen und die Sicherheitsregeln. Firestore speichert nur verschlüsselte Profildaten, die anhand der Benutzer-ID abgeschottet sind.
- Auf deinem Gerät ist eine Firebase-Anmeldesitzung gespeichert, um nach dem Schließen automatisch weiter synchronisieren zu können. Wer ein bereits entsperrtes Gerät vollständig kontrolliert, könnte auf dortige Daten zugreifen; perfekte Sicherheit gibt es nicht.
- Die App zeigt die von Firebase gelieferten Anmelde-/Netzwerkfehler an. Eine echt eingerichtete Firebase-Cloud konnte für diese Version nicht mit deinen persönlichen Projektschlüsseln getestet werden, weil diese noch nicht vorliegen. Der komplette Ablauf wurde mit einem simulierten Firebase-Backend erfolgreich getestet.
- Im Spark-Tarif gibt es Nutzungsgrenzen. Bei privater Nutzung durch zwei Personen ist das üblicherweise ausreichend; Überschreiten der kostenlosen Kontingente oder Änderung der Anbieterbedingungen kann den Dienst einschränken. **Bleibe bei Spark**, wenn du keinesfalls Geld ausgeben willst.
- Verlust des Profilpassworts = kein Entschlüsseln. Die Cloud ersetzt nicht jede Sicherheitskopie.
- Nicht alle Browser garantieren dauerhaften lokalen Speicher. Für automatisches Cloud-Backup muss die Synchronisierung tatsächlich erfolgreich sein.
- Übungen enthalten eigenständige schematische Zeichnungen, keine offiziellen FitX-Gerätefotos.
- Alle Daten einer Tages-Trainingseinheit werden unter demselben Datum geführt; Volumen = Summe(Gewicht × Wiederholungen) über gültige Sätze. Bei einarmigen/zweihändigen Übungen für Volumenberechnung die erfassten Gewichte sinnvoll einheitlich angeben.

## Technische Hinweise

Statisch gehostet: `index.html`, `app.css`, `app.js`, `cloud-config.js`, `cloud.js`, Offline-Service-Worker. Authentisierung über Firebase Identity Toolkit REST; Daten über Cloud Firestore REST mit privaten Sicherheitsregeln. Die Firestore-Schreiboperation verwendet eine `updateTime`-Vorbedingung, um fremde Änderungen nicht unbemerkt zu überschreiben. Clientseitige Verschlüsselung: Web Crypto AES-GCM, PBKDF2 SHA-256 mit 240.000 Iterationen. Lokal unveränderte Profil-Storage-Key-Version `kraftlog.profiles.v1`.

KRAFTLOG ist kein offizielles Produkt von FitX.
