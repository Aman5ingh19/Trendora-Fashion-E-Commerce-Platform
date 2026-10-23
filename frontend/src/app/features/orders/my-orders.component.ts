import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { Order } from '../../core/models/product.model';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  orders = signal<Order[]>([]);
  isLoading = signal<boolean>(true);
  cancellingOrderId = signal<string | null>(null);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        this.orders.set(res.orders || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Failed to load your orders', 'error');
        this.isLoading.set(false);
      }
    });
  }

  canCancel(status: string): boolean {
    return status === 'Placed' || status === 'Confirmed';
  }

  cancelOrder(orderId: string, event: Event) {
    event.stopPropagation();
    if (!confirm('Are you sure you want to cancel this order? Stock will be restored immediately.')) {
      return;
    }

    this.cancellingOrderId.set(orderId);
    this.orderService.cancelOrder(orderId, 'Customer requested cancellation').subscribe({
      next: (res) => {
        this.toastService.show('Order cancelled successfully', 'info');
        this.cancellingOrderId.set(null);
        // Refresh orders list
        this.loadOrders();
      },
      error: (err) => {
        this.cancellingOrderId.set(null);
        this.toastService.show(err.error?.message || 'Failed to cancel order', 'error');
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Placed': return 'status-placed';
      case 'Confirmed': return 'status-confirmed';
      case 'Shipped': return 'status-shipped';
      case 'Delivered': return 'status-delivered';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  }
}
