import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // WICHTIG: Für die Input-Felder im Modal
import { MovieService } from '../services/movie.service';
import { AuthService } from '../services/auth.service';
import { Movie } from '../models/movie.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], // FormsModule hinzugefügt!
  templateUrl: './watchlist.html',
  styleUrl: './watchlist.css',
})
export class Watchlist implements OnInit {
  public movieService = inject(MovieService);
  public authService = inject(AuthService);

  loadedMovies = signal<Movie[]>([]);
  isLoading = signal(true);

  // --- NEU: Modal Status & Formular-Daten ---
  selectedMovieToLog = signal<Movie | null>(null);
  logDate = '';
  logRating: number | undefined = undefined;
  logReview = '';

  ngOnInit() {
    this.loadWatchlistData();
  }

  loadWatchlistData() {
    const user = this.authService.currentUser();
    if (!user || !user.watchlist || user.watchlist.length === 0) {
      this.loadedMovies.set([]);
      this.isLoading.set(false);
      return;
    }

    const apiRequests = user.watchlist.map(id => this.movieService.getMovieById(id));

    forkJoin(apiRequests).subscribe({
      next: (movies) => {
        this.loadedMovies.set(movies);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Fehler beim Laden:', err);
        this.isLoading.set(false);
      }
    });
  }

  // --- NEU: Modal Logik ---
  openLogModal(movie: Movie) {
    this.selectedMovieToLog.set(movie);
    
    // UX-Bonus: Heutiges Datum als Standard setzen
    const today = new Date();
    this.logDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    this.logRating = undefined;
    this.logReview = '';
    
    document.body.style.overflow = 'hidden'; // Hintergrund-Scrollen verhindern
  }

  closeLogModal() {
    this.selectedMovieToLog.set(null);
    document.body.style.overflow = 'auto';
  }

  saveLog() {
    const movie = this.selectedMovieToLog();
    if (!movie || !this.logDate) return; // Sicherheits-Check fürs Datum

    // 1. Die komplexe Transaktion in der Datenbank starten
    this.authService.logMovieToDiary(
      movie.id,
      this.logDate,
      this.logRating,
      this.logReview
    );

    // 2. Film sofort aus der Watchlist-Anzeige verschwinden lassen
    this.loadedMovies.update(movies => movies.filter(m => m.id !== movie.id));

    // 3. Modal schließen
    this.closeLogModal();
  }

  removeFromList(movieId: number, event: Event) {
    // WICHTIG: Verhindert, dass das Modal aufgeht, wenn man nur das X drückt!
    event.stopPropagation(); 
    
    this.authService.removeFromUserWatchlist(movieId);
    this.loadedMovies.update(movies => movies.filter(m => m.id !== movieId));
  }
}