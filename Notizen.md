 1. Watchlist features wie anklicken der filmposter auf der watchlist seite ( dort kann man ihn dann abhacken, bewerten, review schreiben) in einem neuen pop up fenster.

2. neue seite Diary mit den von der Watchlist abgehackten movies, dort im diary steht dann auch die bewertung und das review.

3. Reviews und Bewertungen öffentlich anzuzeigen ( wenn man im explorer auf filme klickt sollen username bewertung und review unter der beschreibung stehen)

4. Haufen kleinigekeiten (Registrierung, Admin login, Profil-seite (neue datei profil.ts etc), profilbilder, design(hovers,farbcode, einheitlich),Text Limit, Burger bearbeiten( farbe, verhalten, leiste, milchglas), Logo oben ändern, ID review einfügen in der db.json) 


npm run backend
a04f584c078b372f0621908ac317699f
Book.pdf in gemini packen und sagen überarbeite, anhand der pdf
Fragt was in der Vorlesung dran kommt.
Er fragt nach script bestimmte fragen nach. Databinding(WPF), Dependency injection, components, kurz project vorstellen und danach in den code gehen oder paralell , API anbindung erklären 

Dein Schlachtplan ist exzellent! Es ist genau die richtige Einstellung für einen Softwareentwickler, sich erst um die Kern-Features (die "Business Logic") zu kümmern und das Polieren (Design, Profilbilder) ans Ende zu stellen.

Deine Liste baut logisch aufeinander auf. Ich habe mir das aus der Perspektive der Software-Architektur angesehen und hier ist mein Feedback zu deinem Plan:

### Analyse deines Schlachtplans

**1. Watchlist Features (Pop-up, Abhaken, Bewerten)**

* **Meinung:** Perfekter nächster Schritt. Wir haben die Watchlist bereits, jetzt machen wir sie interaktiv.
* **Architektur-Check:** Erinnerst du dich an unsere `user.model.ts`? Wir haben dort schon weitsichtig ein `Review`-Interface angelegt (`movieId`, `rating`, `reviewText`, `dateAdded`). Das können wir hierfür perfekt recyceln! Wir müssen nur noch ein Feld wie `isWatched: boolean` hinzufügen.

**2. Diary Seite (Das Tagebuch)**

* **Meinung:** Sehr coole Idee (genau wie bei Letterboxd!).
* **Architektur-Check:** Das wird für uns super einfach zu programmieren. Das Diary ist technisch gesehen einfach nur eine gefilterte Ansicht deiner Watchlist. Wir sagen Angular: *"Zeige mir hier nur die Filme aus der Watchlist, bei denen `isWatched` auf `true` steht."*

**3. Öffentliche Reviews im Explorer**

* **Meinung:** Ein absolutes Must-Have für eine Film-App, **ABER** hier wartet eine kleine Architektur-Falle auf uns!
* **Der Haken:** Aktuell speichern wir Reviews *innerhalb* des Users in der `db.json`. Wenn jemand im Explorer auf "Fight Club" klickt, müsste die App durch *alle* User in der Datenbank wühlen, um zu schauen, ob jemand etwas dazu geschrieben hat. Bei 10.000 Usern würde die App abstürzen.
* **Die Lösung:** Wenn wir bei Schritt 1 die Speicher-Logik bauen, müssen wir eventuell unsere `db.json` leicht anpassen, sodass Reviews eine eigene "Tabelle" (eigenes Array) bekommen. Das ist aber ein Problem für später, ich habe das im Hinterkopf!

**4. Die Kleinigkeiten**

* **Meinung:** Goldrichtig priorisiert. Erst wenn das Haus steht, streichen wir die Wände.

---

### Meine Prioritäten-Empfehlung

Wir sollten deinen Plan exakt in der Reihenfolge abarbeiten, wie du ihn aufgeschrieben hast: **1 ➔ 2 ➔ 3 ➔ 4**. Du kannst Schritt 2 nicht bauen, ohne dass man in Schritt 1 Filme abhaken kann. Und du kannst Schritt 3 nicht bauen, ohne dass in Schritt 1 Reviews geschrieben wurden.

Wir starten also mit **Punkt 1 (Watchlist Interaktionen)**.

Damit wir das Pop-up/Modal auf der Watchlist-Seite öffnen können, müssen wir wissen, was genau passieren soll, wenn der User den Film "abhakt".

**Soll der Film beim Abhaken als "Gesehen" markiert werden und auf der Watchlist bleiben (mit einem grünen Häkchen o.ä.), oder soll er komplett von der Watchlist *verschwinden* und automatisch in das neue "Diary" verschoben werden?**



