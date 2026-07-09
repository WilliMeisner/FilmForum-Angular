import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../services/movie.service';
import { AuthService } from '../services/auth.service';
import { Movie } from '../models/movie.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './watchlist.html',
  styleUrl: './watchlist.css',
})
export class Watchlist implements OnInit {
  public movieService = inject(MovieService);
  public authService = inject(AuthService);

  loadedMovies = signal<Movie[]>([]);
  isLoading = signal(true);

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
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  openLogModal(movie: Movie) {
    this.selectedMovieToLog.set(movie);
    
    const today = new Date();
    this.logDate = today.toISOString().split('T')[0]; 
    this.logRating = undefined;
    this.logReview = '';
    
    document.body.style.overflow = 'hidden';
  }

  closeLogModal() {
    this.selectedMovieToLog.set(null);
    document.body.style.overflow = 'auto';
  }

  saveLog() {
    const movie = this.selectedMovieToLog();
    if (!movie || !this.logDate) return; 

    this.authService.logMovieToDiary(
      movie.id,
      this.logDate,
      this.logRating,
      this.logReview
    );

    this.loadedMovies.update(movies => movies.filter(m => m.id !== movie.id));
    this.closeLogModal();
  }

  removeFromList(movieId: number, event: Event) {
    event.stopPropagation(); 
    this.authService.removeFromUserWatchlist(movieId);
    this.loadedMovies.update(movies => movies.filter(m => m.id !== movieId));
  }
}