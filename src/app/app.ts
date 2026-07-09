import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  public authService = inject(AuthService);
  private router = inject(Router);

  isMenuOpen = signal(false);
  showLoginModal = signal(false);

  loginUser = '';
  loginPass = '';
  loginError = false;

  toggleMenu() {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  onLogin() {
    this.authService.loginCinemaProfile(this.loginUser, this.loginPass).subscribe({
      next: (success) => {
        if (success) {
          this.loginError = false;
          this.showLoginModal.set(false); 
          this.loginUser = '';            
          this.loginPass = '';
        } else {
          this.loginError = true;
        }
      },
      error: (err) => {
        console.error('Datenbank-Fehler:', err);
        this.loginError = true;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.isMenuOpen.set(false);
  }

  onProfileLogout() {
    this.authService.isProfileLoggedIn.set(false);
    this.authService.currentUser.set(null);
    this.showLoginModal.set(false);

    if (this.router.url.includes('watchlist') || this.router.url.includes('diary')) {
      this.router.navigate(['/movie-explorer']);
    }
  }
}