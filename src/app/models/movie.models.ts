export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
}

// Da TMDB bei einer Suche immer eine Liste von Ergebnissen plus Seiten-Infos zurückgibt,
// definieren wir auch die Antwortstruktur der API:
export interface TmdbResponse {
  page: number;
  results: Movie[]; // Hier steckt unser Array aus Filmen drin!
  total_pages: number;
  total_results: number;
}