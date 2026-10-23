import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  private router = inject(Router);
  readonly wishlistService = inject(WishlistService);
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private toastService = inject(ToastService);

  searchQuery = '';
  mobileMenuOpen = signal(false);
  profileDropdownOpen = signal(false);

  // Live signals from AuthService
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.toastService.show('Logged out successfully', 'info');
      this.closeProfileDropdown();
      this.closeMobileMenu();
      this.router.navigate(['/']);
    });
  }

  categories = [
    { label: 'MEN', path: '/products', queryParams: { category: 'Men' } },
    { label: 'WOMEN', path: '/products', queryParams: { category: 'Women' } },
    { label: 'KIDS', path: '/products', queryParams: { category: 'Kids' } },
    { label: 'HOME & LIVING', path: '/products', queryParams: { category: 'Home & Living' } },
    { label: 'BEAUTY', path: '/products', queryParams: { category: 'Beauty' } },
    { label: 'STUDIO', path: '/products', queryParams: { tag: 'studio' }, isNew: true }
  ];

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  toggleProfileDropdown() {
    this.profileDropdownOpen.update(v => !v);
  }

  closeProfileDropdown() {
    this.profileDropdownOpen.set(false);
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchQuery.trim() }
      });
      this.closeMobileMenu();
    }
  }

  clearSearch() {
    this.searchQuery = '';
  }
}
