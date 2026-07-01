import { Component, OnInit, inject, OnDestroy, ViewChild, ElementRef, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../services/movie.service';
import { AuthService } from '../services/auth.service';
import { Movie } from '../models/movie.models';


@Component({
  selector: 'app-movie-explorer',
  standalone :true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movie-explorer.html',
  styleUrl: './movie-explorer.css',
})
export class MovieExplorer implements OnInit, OnDestroy {

  public movieService = inject(MovieService);
  public authService = inject(AuthService);
  
  // 1. Der Anker für das Ende der Seite
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private observer!: IntersectionObserver;

  selectedMovie = signal<Movie | null>(null);

  movieReviews = signal<any[]>([]);
  isLoadingReviews = signal(false);

  searchQuery = '';

  constructor() {
    // Dieser Block wird NUR im Browser ausgeführt
    afterNextRender(() => {
      this.setupIntersectionObserver();
    });
  }


  private setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.movieService.movies().length > 0) {
        this.movieService.loadMovies(true);
      }
    }, { threshold: 0.1 });

    if (this.scrollAnchor) {
      this.observer.observe(this.scrollAnchor.nativeElement);
    }
  }

  ngOnInit() {
    // Initiales Laden
    this.movieService.currentQuery = '';
    this.movieService.loadMovies();
  }

  // 2. Den Sensor aktivieren, sobald die Seite bereit ist
  

  onSearch() {
    // Suchbegriff im Service speichern und neu laden (false = Liste ersetzen)
    this.movieService.currentQuery = this.searchQuery;
    this.movieService.loadMovies(false);
  }

  openDetails(movie: Movie) {
    this.selectedMovie.set(movie);
    document.body.style.overflow = 'hidden';

    // 1. Ladezustand aktivieren und alte Reviews leeren
    this.isLoadingReviews.set(true);
    this.movieReviews.set([]); 

    // 2. Den Daten-Detektiv losschicken
    this.authService.getPublicReviewsForMovie(movie.id).subscribe({
      next: (reviews) => {
        this.movieReviews.set(reviews);
        this.isLoadingReviews.set(false);
      },
      error: (err) => {
        console.error('Fehler beim Laden der Community-Reviews', err);
        this.isLoadingReviews.set(false);
      }
    });
  }

  getStars(rating?: number): string {
    if (!rating) return '';
    return '⭐'.repeat(rating);
  }

  closeDetails() {
    this.selectedMovie.set(null);
    document.body.style.overflow = 'auto';
  }

  getPoster(movie: Movie) {
    return this.movieService.getPosterUrl(movie.poster_path);
  }

  ngOnDestroy() {
    // WICHTIG: Sensor abschalten, wenn wir die Seite verlassen
    if (this.observer) {
      this.observer.disconnect();
    }
    
  }

  addToList(movie: Movie, event: Event) {
    event.stopPropagation();

    if (this.authService.isProfileLoggedIn()) {
      // NEU: Wir rufen den AuthService auf und übergeben NUR die Film-ID!
      const added = this.authService.addToUserWatchlist(movie.id);
      
      if (added) {
        alert(`Erfolg: "${movie.title}" wurde deiner Watchlist erfolgreich hinzugefügt.`);
      } else {
        alert(`"${movie.title}" ist bereits auf deiner Watchlist.`);
      }
    } else {
      alert('Bitte logge dich ein, um Filme zu speichern.');
    }
  }


}
