import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'danger';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  show(message: string, type: Toast['type'] = 'success') {
    const currentToasts = this.toastsSubject.getValue();
    const newToasts = [...currentToasts, { message, type }];
    this.toastsSubject.next(newToasts);

    setTimeout(() => this.removeToast(message), 5000); // Auto-remove
  }

  removeToast(message: string) {
    const updated = this.toastsSubject
      .getValue()
      .filter((toast) => toast.message !== message);
    this.toastsSubject.next(updated);
  }
}
