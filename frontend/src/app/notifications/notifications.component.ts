import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationsService, Toast } from './notifications.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription!: Subscription;

  constructor(private notificationsService: NotificationsService) {}

  ngOnInit() {
    this.subscription = this.notificationsService.toasts$.subscribe((toasts) => {
      this.toasts = toasts;
    });
  }

  dismiss(toast: Toast) {
    this.notificationsService.removeToast(toast.message);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
