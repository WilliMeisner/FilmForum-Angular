// src/app/models/user.model.ts

export interface Review {
  movieId: number;      // Die ID von TMDB
  rating?: number;       // z.B. 1 bis 5 Sterne optional
  reviewText?: string;   // Die Kritik des Users optional
  watchDate: string;    // Wann wurde der film geguckt
}

export interface User {
  id: string;           // Eindeutige User-ID (wichtig für den json-server)
  username: string;     
  password: string;     // (In einer echten App verschlüsselt, hier reicht Klartext)
  watchlist: number[];  // Ein Array aus TMDB-Zahlen, z.B. [550, 120]
  reviews: Review[];    // Ein Array aus den obigen Review-Objekten
}