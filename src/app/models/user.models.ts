export interface Review {
  movieId: number;
  rating?: number;
  reviewText?: string;
  watchDate: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  watchlist: number[];
  reviews: Review[];
}