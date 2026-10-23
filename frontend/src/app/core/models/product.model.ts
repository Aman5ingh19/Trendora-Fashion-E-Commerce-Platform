export interface Product {
  _id: string;
  name: string;
  brand: string;
  description: string;
  category: string | Category | any;
  subCategory?: string;
  gender?: 'Men' | 'Women' | 'Kids' | 'Unisex';
  originalPrice: number;
  price: number; // selling price
  discountPercentage: number;
  images: string[];
  sizes: {
    size: string;
    stock: number;
  }[];
  colors: string[];
  rating: {
    average: number;
    count: number;
  };
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  subCategories?: string[];
  itemCount?: number;
}

export interface CartItem {
  _id?: string;
  product: Product;
  size: string;
  color?: string;
  quantity: number;
  price: number;
}

export interface WishlistItem {
  _id?: string;
  product: Product;
  addedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  addresses?: Address[];
  phone?: string;
  createdAt?: string;
}

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  pincode: string;
  street: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

export interface OrderItem {
  _id?: string;
  product: any;
  name: string;
  image?: string;
  brand?: string;
  size: string;
  price: number;
  quantity: number;
}

export interface StatusHistory {
  status: 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  changedAt: string;
  comment?: string;
}

export interface Order {
  _id: string;
  user: any;
  orderItems: OrderItem[];
  shippingAddress: Address;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'Pending' | 'Completed' | 'Failed';
  pricing: {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
  };
  orderStatus: 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  statusHistory: StatusHistory[];
  estimatedDeliveryDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  statusBreakdown: {
    Placed: number;
    Confirmed: number;
    Shipped: number;
    Delivered: number;
    Cancelled: number;
  };
  lowStockProducts: Product[];
  recentOrders: Order[];
}

