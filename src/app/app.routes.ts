import { Routes } from '@angular/router';

import { MovieExplorer } from './movie-explorer/movie-explorer';
import { Watchlist } from './watchlist/watchlist';
import { Diary } from './diary/diary';

export const routes: Routes = [
  // Startseite: Leitet standardmäßig zum Login weiter
  { path: '', redirectTo: 'movie-explorer', pathMatch: 'full' },
  
  
  { path: 'movie-explorer', component: MovieExplorer },
  { path: 'watchlist', component: Watchlist },
  { path: 'diary', component: Diary },
  
  // Falls jemand eine falsche URL eingibt (Catch-All) -> ab zum Login
  { path: '**', redirectTo: 'movie-explorer' }
];