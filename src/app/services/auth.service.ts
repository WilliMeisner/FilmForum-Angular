import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, Review } from '../models/user.models';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/users';

  isProfileLoggedIn = signal(false);
  currentUser = signal<User | null>(null);

  isLoggedIn() {
    return true;
  }
  
  logout() {
    this.isProfileLoggedIn.set(false);
    this.currentUser.set(null);
  }

  loginCinemaProfile(username: string, password: string): Observable<boolean> {
    const queryUrl = `${this.apiUrl}?username=${username}`;

    return this.http.get<User[]>(queryUrl).pipe(
      map(users => {
        if (users.length > 0) {
          const foundUser = users[0];
          if (foundUser.password === password) {
            this.currentUser.set(foundUser);
            this.isProfileLoggedIn.set(true);
            return true;
          }
        }
        return false; 
      })
    );
  }

  addToUserWatchlist(movieId: number): boolean {
    const user = this.currentUser();
    if (!user) return false; 

    if (user.watchlist.includes(movieId)) {
      return false;
    }

    const updatedWatchlist = [...user.watchlist, movieId];
    this.currentUser.set({ ...user, watchlist: updatedWatchlist });

    const updateUrl = `${this.apiUrl}/${user.id}`;
    this.http.patch(updateUrl, { watchlist: updatedWatchlist }).subscribe({
      error: (err) => console.error(err)
    });

    return true;
  }

  removeFromUserWatchlist(movieId: number) {
    const user = this.currentUser();
    if (!user) return;

    const updatedWatchlist = user.watchlist.filter(id => id !== movieId);
    this.currentUser.set({ ...user, watchlist: updatedWatchlist });

    const updateUrl = `${this.apiUrl}/${user.id}`;
    this.http.patch(updateUrl, { watchlist: updatedWatchlist }).subscribe({
      error: (err) => console.error(err)
    });
  }

  logMovieToDiary(movieId: number, watchDate: string, rating?: number, reviewText?: string) {
    const user = this.currentUser();
    if (!user) return;

    const updatedWatchlist = user.watchlist.filter(id => id !== movieId);
    
    const newReview: Review = { movieId, watchDate };
    
    if (rating !== undefined && rating > 0) {
      newReview.rating = rating;
    }
    if (reviewText && reviewText.trim() !== '') {
      newReview.reviewText = reviewText.trim();
    }

    const updatedReviews = [...user.reviews, newReview];

    this.currentUser.set({ 
      ...user, 
      watchlist: updatedWatchlist, 
      reviews: updatedReviews 
    });

    const updateUrl = `${this.apiUrl}/${user.id}`;
    this.http.patch(updateUrl, { 
      watchlist: updatedWatchlist, 
      reviews: updatedReviews 
    }).subscribe({
      error: (err) => console.error(err)
    });
  }

  getPublicReviewsForMovie(movieId: number): Observable<any[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      map(users => {
        const allReviews: any[] = [];
        
        users.forEach(user => {
          const userReviews = user.reviews.filter(r => r.movieId === movieId);
          userReviews.forEach(r => {
            allReviews.push({
              username: user.username,
              watchDate: r.watchDate,
              rating: r.rating,
              reviewText: r.reviewText
            });
          });
        });
        
        return allReviews.sort((a, b) => 
          new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime()
        );
      })
    );
  }

  deleteFromDiary(movieId: number, watchDate: string) {
    const user = this.currentUser();
    if (!user) return;

    const updatedReviews = user.reviews.filter(r => 
      !(r.movieId === movieId && r.watchDate === watchDate)
    );

    this.currentUser.set({ ...user, reviews: updatedReviews });

    const updateUrl = `${this.apiUrl}/${user.id}`;
    this.http.patch(updateUrl, { reviews: updatedReviews }).subscribe({
      error: (err) => console.error(err)
    });
  }

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
      error: (err) => console.error(err)
    });
  }
}