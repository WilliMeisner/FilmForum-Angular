// src/app/services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User,Review } from '../models/user.models'; // Dein neuer Vertrag!
import { Observable, map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  // Die URL zu deiner lokalen JSON-Datenbank
  private apiUrl = 'http://localhost:3000/users';

  // Signals für den UI-Zustand (bleiben wie gewohnt)
  isProfileLoggedIn = signal(false);
  currentUser = signal<User | null>(null); // Wir speichern jetzt das ganze User-Objekt!

  // 1. Der "System"-Login (für die Hauptseite, bleibt vorerst simpel)
  isLoggedIn() {
    return true; // Hier kannst du später deine Admin-Logik wieder einbauen
  }
  
  logout() {
    this.isProfileLoggedIn.set(false);
    this.currentUser.set(null);
  }

  // 2. Der neue "Profil"-Login mit Datenbank-Abfrage
 loginCinemaProfile(username: string, password: string): Observable<boolean> {
    // 1. Wir fragen den json-server NUR noch nach dem Namen. 
    // Das umgeht das Zahlen-Problem komplett!
    const queryUrl = `${this.apiUrl}?username=${username}`;

    return this.http.get<User[]>(queryUrl).pipe(
      map(users => {
        // Haben wir einen User mit diesem Namen gefunden?
        if (users.length > 0) {
          const foundUser = users[0];
          
          // 2. Wir vergleichen das Passwort hier lokal in Angular.
          // Hier vergleicht TypeScript streng Text mit Text (String === String).
          if (foundUser.password === password) {
            this.currentUser.set(foundUser);
            this.isProfileLoggedIn.set(true);
            return true; // Erfolgreich eingeloggt!
          }
        }
        
        // Wenn kein User gefunden wurde ODER das Passwort falsch war
        return false; 
      })
    );
  }

  addToUserWatchlist(movieId: number): boolean {
    const user = this.currentUser();
    
    // Sicherheitscheck: Ist überhaupt jemand eingeloggt?
    if (!user) return false; 

    // 1. Prüfen, ob die ID schon in der Liste des Users existiert
    if (user.watchlist.includes(movieId)) {
      return false; // Film ist schon drin
    }

    // 2. Eine neue Liste bauen (alte Liste + neue ID)
    const updatedWatchlist = [...user.watchlist, movieId];

    // 3. Den lokalen Zustand sofort aktualisieren (für schnelles UI-Feedback)
    this.currentUser.set({ ...user, watchlist: updatedWatchlist });

    // 4. Die Datenbank im Hintergrund updaten (PATCH)
    const updateUrl = `${this.apiUrl}/${user.id}`;
    this.http.patch(updateUrl, { watchlist: updatedWatchlist }).subscribe({
      error: (err) => console.error('Fehler beim Speichern in der db.json:', err)
    });

    return true;
  }



  removeFromUserWatchlist(movieId: number) {
    const user = this.currentUser();
    if (!user) return;

    // 1. Neue Liste ohne die übergebene ID erstellen
    const updatedWatchlist = user.watchlist.filter(id => id !== movieId);

    // 2. Lokalen Zustand updaten
    this.currentUser.set({ ...user, watchlist: updatedWatchlist });

    // 3. Datenbank im Hintergrund updaten (PATCH)
    const updateUrl = `${this.apiUrl}/${user.id}`;
    this.http.patch(updateUrl, { watchlist: updatedWatchlist }).subscribe({
      error: (err) => console.error('Fehler beim Löschen aus db.json:', err)
    });
  }

  logMovieToDiary(movieId: number, watchDate: string, rating?: number, reviewText?: string) {
    const user = this.currentUser();
    if (!user) return;

    // 1. Film aus der Watchlist entfernen
    const updatedWatchlist = user.watchlist.filter(id => id !== movieId);

    // 2. Das neue Review-Objekt bauen
    const newReview: Review = {
      movieId: movieId,
      watchDate: watchDate
    };
    
    // Die optionalen Felder nur hinzufügen, wenn der User sie ausgefüllt hat
    if (rating !== undefined && rating > 0) {
      newReview.rating = rating;
    }
    if (reviewText && reviewText.trim() !== '') {
      newReview.reviewText = reviewText.trim();
    }

    // 3. Das Review dem Array hinzufügen
    const updatedReviews = [...user.reviews, newReview];

    // 4. Den lokalen Zustand aktualisieren (UI aktualisiert sich sofort)
    this.currentUser.set({ 
      ...user, 
      watchlist: updatedWatchlist, 
      reviews: updatedReviews 
    });

    // 5. Die Datenbank im Hintergrund updaten (Beide Arrays gleichzeitig überschreiben!)
    const updateUrl = `${this.apiUrl}/${user.id}`;
    this.http.patch(updateUrl, { 
      watchlist: updatedWatchlist, 
      reviews: updatedReviews 
    }).subscribe({
      error: (err) => console.error('Fehler beim Verschieben ins Diary:', err)
    });
  }

  /**
   * Durchsucht ALLE User in der Datenbank nach Reviews für einen bestimmten Film.
   */
  getPublicReviewsForMovie(movieId: number): Observable<any[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      map(users => {
        const allReviews: any[] = [];
        
        // 1. Wir durchkämmen jeden User
        users.forEach(user => {
          // 2. Filtern nur die Reviews für diesen einen Film heraus
          const userReviews = user.reviews.filter(r => r.movieId === movieId);
          
          // 3. Wir fügen den Username hinzu, damit wir wissen, von wem das Review ist
          userReviews.forEach(r => {
            allReviews.push({
              username: user.username,
              watchDate: r.watchDate,
              rating: r.rating,
              reviewText: r.reviewText
            });
          });
        });
        
        // 4. Sortieren: Die neuesten Reviews ganz oben!
        return allReviews.sort((a, b) => 
          new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime()
        );
      })
    );
  }



  /**
   * Löscht einen Eintrag aus dem Diary (Reviews-Array)
   */
  deleteFromDiary(movieId: number, watchDate: string) {
    const user = this.currentUser();
    if (!user) return;

    const updatedReviews = user.reviews.filter(r => 
      !(r.movieId === movieId && r.watchDate === watchDate)
    );

    this.currentUser.set({ ...user, reviews: updatedReviews });

    const updateUrl = `${this.apiUrl}/${user.id}`;
    this.http.patch(updateUrl, { reviews: updatedReviews }).subscribe({
      error: (err) => console.error('Fehler beim Löschen aus dem Diary:', err)
    });
  }

  /**
   * Aktualisiert einen bestehenden Diary-Eintrag
   */
  updateDiaryEntry(movieId: number, oldDate: string, newData: { watchDate: string, rating?: number, reviewText?: string }) {
    const user = this.currentUser();
    if (!user) return;

    const updatedReviews = user.reviews.map(r => {
      if (r.movieId === movieId && r.watchDate === oldDate) {
        return {
          movieId: movieId,
          watchDate: newData.watchDate,
          rating: newData.rating,
          reviewText: newData.reviewText
        };
      }
      return r;
    });

    this.currentUser.set({ ...user, reviews: updatedReviews });

    const updateUrl = `${this.apiUrl}/${user.id}`;
    this.http.patch(updateUrl, { reviews: updatedReviews }).subscribe({
      error: (err) => console.error('Fehler beim Update des Diarys:', err)
    });
  }


}