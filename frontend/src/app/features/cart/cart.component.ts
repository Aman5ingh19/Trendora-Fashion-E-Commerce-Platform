import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CartItem } from '../../core/models/product.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {
  readonly cartService = inject(CartService);
  readonly wishlistService = inject(WishlistService);
  readonly authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  quantityOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  get defaultAddress() {
    const user = this.authService.currentUser();
    if (!user || !user.addresses || user.addresses.length === 0) return null;
    return user.addresses.find(a => a.isDefault) || user.addresses[0];
  }

  get freeDeliveryRemaining(): number {
    const sub = this.cartService.subtotal();
    return Math.max(0, 999 - sub);
  }

  get freeDeliveryProgress(): number {
    const sub = this.cartService.subtotal();
    return Math.min(100, Math.round((sub / 999) * 100));
  }

  onQuantityChange(item: CartItem, newQty: number) {
    this.cartService.updateQuantity(item._id || '', Number(newQty));
    this.toastService.show(`Updated quantity to ${newQty}`, 'info');
  }

  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item._id || '');
    this.toastService.show(`Removed "${item.product?.name}" from your bag`, 'info');
  }

  moveToWishlist(item: CartItem) {
    if (item.product) {
      this.wishlistService.toggleWishlist(item.product);
      this.cartService.removeFromCart(item._id || '');
      this.toastService.show(`Moved "${item.product.name}" to Wishlist`, 'success');
    }
  }

  proceedToCheckout() {
    if (!this.authService.isLoggedIn()) {
      this.toastService.show('Please log in to proceed to checkout', 'info');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    this.router.navigate(['/checkout']);
  }
}
