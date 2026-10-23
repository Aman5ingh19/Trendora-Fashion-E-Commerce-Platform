import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { Address } from '../../core/models/product.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  selectedAddressId = signal<string>('');
  showAddressModal = signal<boolean>(false);
  selectedPaymentMethod = signal<'COD' | 'ONLINE'>('COD');
  isSubmitting = signal<boolean>(false);

  addressForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+ -]{10,14}$/)]],
    pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    street: ['', [Validators.required, Validators.minLength(5)]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    isDefault: [false]
  });

  ngOnInit() {
    // If cart is empty, redirect to cart page
    if (this.cartService.count() === 0) {
      this.toastService.show('Your cart is empty', 'info');
      this.router.navigate(['/cart']);
      return;
    }

    this.initDefaultAddress();
  }

  private initDefaultAddress() {
    const addresses = this.addresses;
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      if (defaultAddr && defaultAddr._id) {
        this.selectedAddressId.set(defaultAddr._id);
      }
    }
  }

  get addresses(): Address[] {
    return this.authService.currentUser()?.addresses || [];
  }

  get selectedAddress(): Address | undefined {
    return this.addresses.find(a => a._id === this.selectedAddressId());
  }

  selectAddress(addressId?: string) {
    if (addressId) {
      this.selectedAddressId.set(addressId);
    }
  }

  openAddressModal() {
    this.addressForm.reset({ isDefault: this.addresses.length === 0 });
    this.showAddressModal.set(true);
  }

  closeAddressModal() {
    this.showAddressModal.set(false);
  }

  saveAddress() {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.authService.addAddress(this.addressForm.value).subscribe({
      next: (res) => {
        this.toastService.show('Address added successfully', 'success');
        this.closeAddressModal();
        if (res.addresses && res.addresses.length > 0) {
          const lastAdded = res.addresses[res.addresses.length - 1];
          if (lastAdded._id) {
            this.selectedAddressId.set(lastAdded._id);
          }
        }
      },
      error: () => {
        this.toastService.show('Failed to save address. Please try again.', 'error');
      }
    });
  }

  proceedToPlaceOrder() {
    const selected = this.selectedAddress;
    if (!selected) {
      this.toastService.show('Please select or add a delivery address to proceed', 'error');
      return;
    }

    this.isSubmitting.set(true);

    this.orderService.createOrder({
      shippingAddress: selected,
      paymentMethod: this.selectedPaymentMethod()
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.cartService.fetchBackendCart(); // Refresh cart from server (now empty)
        this.toastService.show('Order placed successfully! 🎉', 'success');
        this.router.navigate(['/orders', res.order._id]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg = err.error?.message || 'Failed to place order. Please try again.';
        this.toastService.show(errorMsg, 'error');
      }
    });
  }
}

