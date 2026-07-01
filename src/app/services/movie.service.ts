import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie, TmdbResponse } from '../models/movie.models';


@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private http = inject(HttpClient);
  
  // Dein Key ist schon drin!
  private apiKey = 'a04f584c078b372f0621908ac317699f'; 
  private baseUrl = 'https://api.themoviedb.org/3';
  private imgBaseUrl = 'https://image.tmdb.org/t/p/w500';

  // Paginierung & Suche
  private currentPage = 1;
  public currentQuery = '';

  // Die globalen Signale für deine UI
  movies = signal<Movie[]>([]);
  watchlist = signal<Movie[]>([]);

  /**
   * Lädt Filme (Popular oder Suche) und unterstützt Paginierung (Scrollen)
   */
  loadMovies(append: boolean = false) {
    if (!append) {
      this.currentPage = 1;
    } else {
      this.currentPage++;
    }

    const endpoint = this.currentQuery 
      ? `${this.baseUrl}/search/movie?query=${this.currentQuery}&`
      : `${this.baseUrl}/movie/top_rated?`;

    const url = `${endpoint}api_key=${this.apiKey}&language=de-DE&page=${this.currentPage}`;

    this.http.get<TmdbResponse>(url).subscribe({
      next: (res) => {
        if (append) {
          // Die neuen Filme werden mit den alten kombiniert
          this.movies.update(oldMovies => [...oldMovies, ...res.results]);
        } else {
          // Liste komplett ersetzen
          this.movies.set(res.results);
        }
      },
      error: (err) => console.error('Fehler beim Laden der Filme:', err)
    });
  }

  /**
   * NEU: Lädt einen einzelnen Film anhand der ID. 
   * (Das brauchen wir bald zwingend für deine JSON-Watchlist!)
   */
  getMovieById(id: number): Observable<Movie> {
    const url = `${this.baseUrl}/movie/${id}?api_key=${this.apiKey}&language=de-DE`;
    return this.http.get<Movie>(url);
  }

  /**
   * Hilfsfunktion um den vollen Pfad zum Filmbild zu bauen
   */
  getPosterUrl(path: string | null): string {
    if (!path) {
      return 'https://via.placeholder.com/500x750?text=Kein+Poster';
    }
    return `${this.imgBaseUrl}${path}`;
  }

}