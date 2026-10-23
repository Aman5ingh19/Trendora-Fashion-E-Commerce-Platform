import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { Order, Product, DashboardMetrics } from '../../core/models/product.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  activeTab = signal<'orders' | 'products' | 'metrics'>('orders');
  isLoadingMetrics = signal<boolean>(true);
  isLoadingOrders = signal<boolean>(true);
  isLoadingProducts = signal<boolean>(true);

  metrics = signal<DashboardMetrics | null>(null);
  orders = signal<Order[]>([]);
  products = signal<Product[]>([]);

  selectedOrderStatusFilter = signal<string>('All');
  orderPage = signal<number>(1);
  totalOrderPages = signal<number>(1);

  // Product Modal State
  showProductModal = signal<boolean>(false);
  editingProductId = signal<string | null>(null);

  productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    brand: ['', [Validators.required]],
    category: ['Clothing', [Validators.required]],
    gender: ['Unisex', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    price: [999, [Validators.required, Validators.min(1)]],
    originalPrice: [1999, [Validators.required, Validators.min(1)]],
    imageUrl: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', [Validators.required]],
    sizeS: [10, [Validators.required, Validators.min(0)]],
    sizeM: [15, [Validators.required, Validators.min(0)]],
    sizeL: [12, [Validators.required, Validators.min(0)]],
    sizeXL: [8, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() {
    this.loadMetrics();
    this.loadOrders();
    this.loadProducts();
  }

  loadMetrics() {
    this.isLoadingMetrics.set(true);
    this.orderService.getDashboardMetrics().subscribe({
      next: (res) => {
        this.metrics.set(res.data);
        this.isLoadingMetrics.set(false);
      },
      error: () => {
        this.isLoadingMetrics.set(false);
      }
    });
  }

  loadOrders() {
    this.isLoadingOrders.set(true);
    this.orderService.getAllOrders(
      this.selectedOrderStatusFilter(),
      this.orderPage(),
      15
    ).subscribe({
      next: (res) => {
        this.orders.set(res.orders || []);
        this.totalOrderPages.set(res.pages || 1);
        this.isLoadingOrders.set(false);
      },
      error: () => {
        this.toastService.show('Failed to fetch orders', 'error');
        this.isLoadingOrders.set(false);
      }
    });
  }

  loadProducts() {
    this.isLoadingProducts.set(true);
    this.productService.getProducts({ limit: 50 }).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.isLoadingProducts.set(false);
      },
      error: () => {
        this.isLoadingProducts.set(false);
      }
    });
  }

  getCategoryName(category: any): string {
    if (!category) return 'Clothing';
    if (typeof category === 'object') return category.name || 'Clothing';
    return String(category);
  }

  onFilterStatusChange(status: string) {
    this.selectedOrderStatusFilter.set(status);
    this.orderPage.set(1);
    this.loadOrders();
  }

  updateOrderStatus(order: Order, newStatus: string) {
    if (order.orderStatus === newStatus) return;

    this.orderService.updateOrderStatus(order._id, newStatus).subscribe({
      next: (res) => {
        order.orderStatus = res.order.orderStatus;
        this.toastService.show(`Order #${order._id.slice(-6)} status updated to ${newStatus}`, 'success');
        this.loadMetrics(); // refresh KPI counts
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to update order status', 'error');
        this.loadOrders(); // reset view
      }
    });
  }

  openCreateProductModal() {
    this.editingProductId.set(null);
    this.productForm.reset({
      name: '',
      brand: 'TRENDORA',
      category: 'Clothing',
      gender: 'Men',
      description: '',
      price: 999,
      originalPrice: 1999,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      sizeS: 10,
      sizeM: 15,
      sizeL: 12,
      sizeXL: 8
    });
    this.showProductModal.set(true);
  }

  openEditProductModal(product: Product) {
    this.editingProductId.set(product._id);
    const sStock = product.sizes.find(s => s.size === 'S')?.stock || 0;
    const mStock = product.sizes.find(s => s.size === 'M')?.stock || 0;
    const lStock = product.sizes.find(s => s.size === 'L')?.stock || 0;
    const xlStock = product.sizes.find(s => s.size === 'XL')?.stock || 0;

    this.productForm.setValue({
      name: product.name,
      brand: product.brand,
      category: typeof product.category === 'object' ? (product.category?.name || 'Clothing') : (product.category || 'Clothing'),
      gender: product.gender || 'Unisex',
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      imageUrl: product.images[0] || '',
      sizeS: sStock,
      sizeM: mStock,
      sizeL: lStock,
      sizeXL: xlStock
    });
    this.showProductModal.set(true);
  }

  closeProductModal() {
    this.showProductModal.set(false);
    this.editingProductId.set(null);
  }

  saveProduct() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const val = this.productForm.value;
    const payload: any = {
      name: val.name,
      brand: val.brand,
      category: val.category,
      gender: val.gender,
      description: val.description,
      price: Number(val.price),
      originalPrice: Number(val.originalPrice),
      images: [val.imageUrl],
      sizes: [
        { size: 'S', stock: Number(val.sizeS) },
        { size: 'M', stock: Number(val.sizeM) },
        { size: 'L', stock: Number(val.sizeL) },
        { size: 'XL', stock: Number(val.sizeXL) }
      ]
    };

    const editId = this.editingProductId();
    if (editId) {
      this.orderService.updateProduct(editId, payload).subscribe({
        next: () => {
          this.toastService.show('Product updated successfully', 'success');
          this.closeProductModal();
          this.loadProducts();
          this.loadMetrics();
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Failed to update product', 'error');
        }
      });
    } else {
      this.orderService.createProduct(payload).subscribe({
        next: () => {
          this.toastService.show('New product created successfully', 'success');
          this.closeProductModal();
          this.loadProducts();
          this.loadMetrics();
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Failed to create product', 'error');
        }
      });
    }
  }

  deleteProduct(productId: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.orderService.deleteProduct(productId).subscribe({
      next: () => {
        this.toastService.show('Product deleted successfully', 'info');
        this.loadProducts();
        this.loadMetrics();
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to delete product', 'error');
      }
    });
  }

  getTotalStock(product: Product): number {
    return product.sizes.reduce((sum, s) => sum + s.stock, 0);
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
