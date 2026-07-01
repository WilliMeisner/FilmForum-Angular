import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // WICHTIG für ngModel (das Login-Formular)
import { AuthService } from './services/auth.service'; // Dein neuer Service-Pfad!

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Services einbinden
  public authService = inject(AuthService);
  private router = inject(Router);

  // Steuerung für UI-Elemente
  isMenuOpen = signal(false);
  showLoginModal = signal(false);

  // Variablen für das Profil-Login-Formular in der Topbar
  loginUser = '';
  loginPass = '';
  loginError = false;

  // Sidebar öffnen/schließen
  toggleMenu() {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  // Profil einloggen (aus dem Dropdown)
  onLogin() {
    // Da es jetzt über das Netzwerk geht, nutzen wir .subscribe()
    this.authService.loginCinemaProfile(this.loginUser, this.loginPass).subscribe({
      next: (success) => {
        if (success) {
          this.loginError = false;
          this.showLoginModal.set(false); // Dropdown schließen
          this.loginUser = '';            // Felder leeren
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

  // Kompletter System-Logout (aus der Sidebar)
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.isMenuOpen.set(false); // Sidebar nach Logout schließen
  }

  // Nur das Profil abmelden (aus dem Dropdown)
  onProfileLogout() {
    this.authService.isProfileLoggedIn.set(false);
    this.authService.currentUser.set(null);
    this.showLoginModal.set(false);

    // Wenn wir auf der Watchlist sind, zurück zum Explorer
    if (this.router.url.includes('watchlist')) {
      this.router.navigate(['/movie-explorer']);
    }
  }
}