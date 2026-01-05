
export type Role = 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  role: Role;
  class?: string;
  avatarUrl?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  year: number;
  isbn: string;
  coverUrl: string;
  price: number;
  totalCopies: number;
  availableCopies: number;
  currentBorrowers: { userId: string; userName: string }[];
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface BorrowRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  status: RequestStatus;
  timestamp: number;
}

export interface HistoryRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  borrowDate: number;
  returnDate?: number;
}
