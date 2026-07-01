import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../services/movie.service';
import { AuthService } from '../services/auth.service';
import { Movie } from '../models/movie.models';
import { forkJoin, map } from 'rxjs';

// Ein lokales Interface, das Filmdaten und Review-Daten kombiniert
interface DiaryEntry {
  movie: Movie;
  watchDate: string;
  rating?: number;
  reviewText?: string;
}

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './diary.html',
  styleUrl: './diary.css',
})
export class Diary implements OnInit {
  public movieService = inject(MovieService);
  public authService = inject(AuthService);

  diaryEntries = signal<DiaryEntry[]>([]);
  isLoading = signal(true);

  // --- Modal & Edit State ---
  selectedEntryForEdit = signal<DiaryEntry | null>(null);
  originalDate = ''; // Um den Eintrag in der DB wiederzufinden
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

    // Wir erstellen für jedes Review eine API-Anfrage an TMDB
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
        // Sortierung: Neuestes Datum zuerst
        const sortedEntries = entries.sort((a, b) => 
          new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime()
        );
        this.diaryEntries.set(sortedEntries);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Fehler beim Laden des Diarys:', err);
        this.isLoading.set(false);
      }
    });
  }


  // --- Modal Funktionen ---
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

    // Lokale Liste neu laden
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

  // Hilfsfunktion für die Sterne-Anzeige
  getStars(rating?: number): string {
    if (!rating) return '';
    return '⭐'.repeat(rating);
  }
}