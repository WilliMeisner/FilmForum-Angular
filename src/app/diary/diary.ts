import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../services/movie.service';
import { AuthService } from '../services/auth.service';
import { Movie } from '../models/movie.models';
import { forkJoin, map } from 'rxjs';

interface DiaryEntry {
  movie: Movie;
  watchDate: string;
  rating?: number;
  reviewText?: string;
}

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diary.html',
  styleUrl: './diary.css',
})
export class Diary implements OnInit {
  public movieService = inject(MovieService);
  public authService = inject(AuthService);

  diaryEntries = signal<DiaryEntry[]>([]);
  isLoading = signal(true);

  selectedEntryForEdit = signal<DiaryEntry | null>(null);
  originalDate = ''; 
  editDate = '';
  editRating: number | undefined = undefined;
  editReview = '';

  ngOnInit() {
    this.loadDiaryData();
  }

  loadDiaryData() {
    const user = this.authService.currentUser();
    
    if (!user || !user.reviews || user.reviews.length === 0) {
      this.diaryEntries.set([]);
      this.isLoading.set(false);
      return;
    }

    const apiRequests = user.reviews.map(review => 
      this.movieService.getMovieById(review.movieId).pipe(
        map(movie => ({
          movie: movie,
          watchDate: review.watchDate,
          rating: review.rating,
          reviewText: review.reviewText
        }))
      )
    );

    forkJoin(apiRequests).subscribe({
      next: (entries) => {
        const sortedEntries = entries.sort((a, b) => 
          new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime()
        );
        this.diaryEntries.set(sortedEntries);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  openEditModal(entry: DiaryEntry) {
    this.selectedEntryForEdit.set(entry);
    this.originalDate = entry.watchDate;
    this.editDate = entry.watchDate;
    this.editRating = entry.rating;
    this.editReview = entry.reviewText || '';
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.selectedEntryForEdit.set(null);
    document.body.style.overflow = 'auto';
  }

  saveChanges() {
    const entry = this.selectedEntryForEdit();
    if (!entry) return;

    this.authService.updateDiaryEntry(entry.movie.id, this.originalDate, {
      watchDate: this.editDate,
      rating: this.editRating,
      reviewText: this.editReview
    });

    this.loadDiaryData();
    this.closeModal();
  }

  deleteEntry() {
    const entry = this.selectedEntryForEdit();
    if (!entry) return;

    if (confirm(`Möchtest du den Eintrag für "${entry.movie.title}" wirklich löschen?`)) {
      this.authService.deleteFromDiary(entry.movie.id, entry.watchDate);
      this.loadDiaryData();
      this.closeModal();
    }
  }

  getStars(rating?: number): string {
    if (!rating) return '';
    return '⭐'.repeat(rating);
  }
}