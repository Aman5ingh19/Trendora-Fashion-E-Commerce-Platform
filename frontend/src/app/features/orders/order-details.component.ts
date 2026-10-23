import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { Order } from '../../core/models/product.model';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  order = signal<Order | null>(null);
  isLoading = signal<boolean>(true);
  isCancelling = signal<boolean>(false);

  steps = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    } else {
      this.router.navigate(['/orders']);
    }
  }

  loadOrder(id: string) {
    this.isLoading.set(true);
    this.orderService.getOrderById(id).subscribe({
      next: (res) => {
        this.order.set(res.order);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to load order details', 'error');
        this.isLoading.set(false);
        this.router.navigate(['/orders']);
      }
    });
  }

  getStepIndex(status?: string): number {
    if (!status) return 0;
    if (status === 'Cancelled') return -1;
    return this.steps.indexOf(status);
  }

  canCancel(status?: string): boolean {
    return status === 'Placed' || status === 'Confirmed';
  }

  cancelOrder() {
    const currentOrder = this.order();
    if (!currentOrder) return;

    if (!confirm('Are you sure you want to cancel this order? The reserved stock will be immediately returned to inventory.')) {
      return;
    }

    this.isCancelling.set(true);
    this.orderService.cancelOrder(currentOrder._id, 'Customer cancellation via details page').subscribe({
      next: (res) => {
        this.isCancelling.set(false);
        this.order.set(res.order);
        this.toastService.show('Order has been cancelled successfully', 'info');
      },
      error: (err) => {
        this.isCancelling.set(false);
        this.toastService.show(err.error?.message || 'Failed to cancel order', 'error');
      }
    });
  }
}
