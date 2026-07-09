import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie, TmdbResponse } from '../models/movie.models';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private http = inject(HttpClient);
  
  private apiKey = 'a04f584c078b372f0621908ac317699f'; 
  private baseUrl = 'https://api.themoviedb.org/3';
  private imgBaseUrl = 'https://image.tmdb.org/t/p/w500';

  private currentPage = 1;
  public currentQuery = '';

  movies = signal<Movie[]>([]);
  watchlist = signal<Movie[]>([]);

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
          this.movies.update(oldMovies => [...oldMovies, ...res.results]);
        } else {
          this.movies.set(res.results);
        }
      },
      error: (err) => console.error(err)
    });
  }

  getMovieById(id: number): Observable<Movie> {
    const url = `${this.baseUrl}/movie/${id}?api_key=${this.apiKey}&language=de-DE`;
    return this.http.get<Movie>(url);
  }

  getPosterUrl(path: string | null): string {
    if (!path) {
      return 'https://via.placeholder.com/500x750?text=Kein+Poster';
    }
    return `${this.imgBaseUrl}${path}`;
  }
}