import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['snackbar-error']
    });
  }

  warn(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['snackbar-warn']
    });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-info']
    });
  }
}
