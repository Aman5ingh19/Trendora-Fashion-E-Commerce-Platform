import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent {
  readonly wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  activeSizePickerProductId = signal<string | null>(null);

  removeItem(product: Product, event: Event) {
    event.stopPropagation();
    this.wishlistService.removeFromWishlist(product._id);
    this.toastService.show(`Removed "${product.name}" from Wishlist`, 'info');
  }

  openSizePicker(productId: string, event: Event) {
    event.stopPropagation();
    this.activeSizePickerProductId.set(productId);
  }

  closeSizePicker() {
    this.activeSizePickerProductId.set(null);
  }

  moveSelectedSizeToCart(product: Product, size: string, event: Event) {
    event.stopPropagation();
    this.cartService.addToCart(product, size, 1);
    this.wishlistService.removeFromWishlist(product._id);
    this.activeSizePickerProductId.set(null);
    this.toastService.show(`Moved to Bag (Size: ${size})`, 'success');
  }
}
