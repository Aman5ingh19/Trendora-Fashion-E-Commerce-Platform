import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';

interface HeroSlide {
  id: number;
  tagline: string;
  title: string;
  subtitle: string;
  discount: string;
  ctaText: string;
  categoryQuery: string;
  imageUrl: string;
  bgGradient: string;
}

interface TrendingCategory {
  name: string;
  query: string;
  imageUrl: string;
  discount: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);

  // Hero Carousel State
  currentSlide = signal(0);
  private autoSlideTimer: any;

  heroSlides: HeroSlide[] = [
    {
      id: 1,
      tagline: 'EXCLUSIVE SPRING FESTIVAL',
      title: 'Define Your Everyday Trend',
      subtitle: 'Curated international edits for men and women with effortless modern elegance.',
      discount: '50% - 80% OFF',
      ctaText: 'EXPLORE COLLECTION',
      categoryQuery: 'Women',
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
      bgGradient: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)'
    },
    {
      id: 2,
      tagline: 'PREMIUM STREETWEAR & SNEAKERS',
      title: 'Urban High-Street Drop',
      subtitle: 'Oversized silhouettes, drop-shoulder tees, cargo aesthetics & iconic kicks.',
      discount: 'FLAT 40% - 60% OFF',
      ctaText: 'SHOP STREETWEAR',
      categoryQuery: 'Men',
      imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1200&auto=format&fit=crop&q=80',
      bgGradient: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)'
    },
    {
      id: 3,
      tagline: 'TIMELESS ETHNIC GLAM',
      title: 'Handcrafted Heritage Luxe',
      subtitle: 'Exquisite silk kurtas, designer lehengas, and embroidered royal sherwanis.',
      discount: 'UP TO 70% OFF',
      ctaText: 'DISCOVER ETHNIC',
      categoryQuery: 'Women',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=80',
      bgGradient: 'linear-gradient(135deg, #4a00e0 0%, #8e2de2 100%)'
    }
  ];

  // Trending Categories
  trendingCategories: TrendingCategory[] = [
    {
      name: "Men's Casuals",
      query: 'Men',
      imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=400&auto=format&fit=crop&q=80',
      discount: '40-70% OFF'
    },
    {
      name: "Women's Ethnic",
      query: 'Women',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80',
      discount: '50-80% OFF'
    },
    {
      name: 'Western Dresses',
      query: 'Women',
      imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&auto=format&fit=crop&q=80',
      discount: 'FLAT 50% OFF'
    },
    {
      name: 'Sneakers & Kicks',
      query: 'Men',
      imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&auto=format&fit=crop&q=80',
      discount: '30-60% OFF'
    },
    {
      name: 'Kids Wear',
      query: 'Kids',
      imageUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=400&auto=format&fit=crop&q=80',
      discount: 'UP TO 70% OFF'
    },
    {
      name: 'Home & Living',
      query: 'Home & Living',
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80',
      discount: 'MIN 40% OFF'
    },
    {
      name: 'Beauty & Fragrance',
      query: 'Beauty',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
      discount: 'UP TO 50% OFF'
    },
    {
      name: 'Watches & Bags',
      query: 'Men',
      imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&auto=format&fit=crop&q=80',
      discount: '40-65% OFF'
    }
  ];

  // Active filter tab
  activeTab = signal<'all' | 'trending' | 'men' | 'women' | 'deals'>('all');

  // Flash Sale Countdown State
  countdownHours = signal('05');
  countdownMins = signal('43');
  countdownSecs = signal('29');
  private countdownInterval: any;

  // Sample Products for Stage 2 (until Stage 4 API connection)
  sampleProducts: Product[] = [
    {
      _id: 'p1',
      name: 'Oversized Cotton Poplin Casual Shirt',
      brand: 'HIGHLANDER',
      description: 'Relaxed fit drop-shoulder pure cotton poplin shirt with Cuban collar and patch pocket.',
      category: 'Men',
      gender: 'Men',
      originalPrice: 1999,
      price: 799,
      discountPercentage: 60,
      images: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80'
      ],
      sizes: [
        { size: 'S', stock: 12 },
        { size: 'M', stock: 8 },
        { size: 'L', stock: 15 },
        { size: 'XL', stock: 5 }
      ],
      colors: ['Sky Blue', 'White'],
      rating: { average: 4.3, count: 1240 },
      isFeatured: true,
      isTrending: true
    },
    {
      _id: 'p2',
      name: 'Floral Print Georgette Fit & Flare Maxi Dress',
      brand: 'VERO MODA',
      description: 'Chic floral printed tiered maxi dress with sweetheart neckline and flutter sleeves.',
      category: 'Women',
      gender: 'Women',
      originalPrice: 3499,
      price: 1399,
      discountPercentage: 60,
      images: [
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80'
      ],
      sizes: [
        { size: 'XS', stock: 6 },
        { size: 'S', stock: 14 },
        { size: 'M', stock: 9 },
        { size: 'L', stock: 4 }
      ],
      colors: ['Sage Floral', 'Coral Pink'],
      rating: { average: 4.6, count: 860 },
      isFeatured: true,
      isTrending: true
    },
    {
      _id: 'p3',
      name: 'Slim Fit Acid Wash Heavyweight Denim Jacket',
      brand: 'ROADSTER',
      description: 'Vintage styled faded blue denim jacket with dual chest flap pockets and antique bronze buttons.',
      category: 'Men',
      gender: 'Men',
      originalPrice: 2999,
      price: 1199,
      discountPercentage: 60,
      images: [
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80'
      ],
      sizes: [
        { size: 'M', stock: 10 },
        { size: 'L', stock: 18 },
        { size: 'XL', stock: 7 }
      ],
      colors: ['Washed Indigo'],
      rating: { average: 4.4, count: 2150 },
      isFeatured: true,
      isTrending: true
    },
    {
      _id: 'p4',
      name: 'Embroidered Chanderi Silk Kurta Set with Dupatta',
      brand: 'LIBAS',
      description: 'Stunning magenta chanderi silk straight kurta with zari embroidery, matched trousers and organza dupatta.',
      category: 'Women',
      gender: 'Women',
      originalPrice: 4999,
      price: 1899,
      discountPercentage: 62,
      images: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80'
      ],
      sizes: [
        { size: 'S', stock: 8 },
        { size: 'M', stock: 12 },
        { size: 'L', stock: 11 },
        { size: 'XXL', stock: 3 }
      ],
      colors: ['Magenta', 'Teal Gold'],
      rating: { average: 4.7, count: 3410 },
      isFeatured: true,
      isTrending: true
    },
    {
      _id: 'p5',
      name: 'Retro Classic Court Chunky Lifestyle Sneakers',
      brand: 'PUMA',
      description: 'Retro low-top sneakers with perforated toe box, cushioned IMEVA midsole and contrast stripe branding.',
      category: 'Men',
      gender: 'Men',
      originalPrice: 4499,
      price: 2249,
      discountPercentage: 50,
      images: [
        'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80'
      ],
      sizes: [
        { size: 'UK 7', stock: 5 },
        { size: 'UK 8', stock: 10 },
        { size: 'UK 9', stock: 8 },
        { size: 'UK 10', stock: 4 }
      ],
      colors: ['White / Forest Green'],
      rating: { average: 4.5, count: 1890 },
      isFeatured: true,
      isTrending: true
    },
    {
      _id: 'p6',
      name: 'Structured Vegan Leather Crossbody Handbag',
      brand: 'MANGO',
      description: 'Polished box silhouette tote with detachable gold chain strap, twist lock closure and dual interior compartments.',
      category: 'Women',
      gender: 'Women',
      originalPrice: 3290,
      price: 1645,
      discountPercentage: 50,
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80'
      ],
      sizes: [
        { size: 'Regular', stock: 15 }
      ],
      colors: ['Tan Brown', 'Jet Black'],
      rating: { average: 4.8, count: 620 },
      isFeatured: true,
      isTrending: false
    },
    {
      _id: 'p7',
      name: 'Relaxed Fit Graphic Heavyweight Hooded Sweatshirt',
      brand: 'H&M',
      description: 'Cozy brushed fleece hoodie with streetwear typography embroidery, ribbed cuffs and kangaroo pouch.',
      category: 'Men',
      gender: 'Men',
      originalPrice: 2299,
      price: 1149,
      discountPercentage: 50,
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80'
      ],
      sizes: [
        { size: 'S', stock: 7 },
        { size: 'M', stock: 12 },
        { size: 'L', stock: 14 }
      ],
      colors: ['Olive Drab', 'Charcoal'],
      rating: { average: 4.4, count: 980 },
      isFeatured: true,
      isTrending: true
    },
    {
      _id: 'p8',
      name: 'High-Rise Straight Leg Vintage Distressed Jeans',
      brand: 'LEVIS',
      description: 'Iconic 501 inspired non-stretch denim jeans with flattering high-rise contour and button fly.',
      category: 'Women',
      gender: 'Women',
      originalPrice: 3999,
      price: 1999,
      discountPercentage: 50,
      images: [
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=600&auto=format&fit=crop&q=80'
      ],
      sizes: [
        { size: '28', stock: 8 },
        { size: '30', stock: 11 },
        { size: '32', stock: 6 }
      ],
      colors: ['Medium Stonewash'],
      rating: { average: 4.6, count: 1430 },
      isFeatured: true,
      isTrending: true
    }
  ];

  brands = [
    { name: 'PUMA', logo: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200&auto=format&fit=crop&q=80', discount: 'UP TO 60% OFF' },
    { name: 'NIKE', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80', discount: 'MIN 40% OFF' },
    { name: "LEVI'S", logo: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&auto=format&fit=crop&q=80', discount: 'FLAT 50% OFF' },
    { name: 'VERO MODA', logo: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&auto=format&fit=crop&q=80', discount: 'UP TO 70% OFF' },
    { name: 'ROADSTER', logo: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=200&auto=format&fit=crop&q=80', discount: 'UNDER ₹999' },
    { name: 'MANGO', logo: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&auto=format&fit=crop&q=80', discount: '40-60% OFF' }
  ];

  get filteredProducts(): Product[] {
    const tab = this.activeTab();
    if (tab === 'trending') {
      return this.sampleProducts.filter(p => p.isTrending);
    }
    if (tab === 'men') {
      return this.sampleProducts.filter(p => p.gender === 'Men');
    }
    if (tab === 'women') {
      return this.sampleProducts.filter(p => p.gender === 'Women');
    }
    if (tab === 'deals') {
      return this.sampleProducts.filter(p => p.discountPercentage >= 60);
    }
    return this.sampleProducts;
  }

  ngOnInit() {
    this.startAutoSlide();
    this.startCountdown();
    this.fetchLiveProducts();
  }

  fetchLiveProducts() {
    this.productService.getProducts({ limit: 12 }).subscribe(res => {
      if (res && res.data && res.data.length > 0) {
        this.sampleProducts = res.data;
      }
    });
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  startAutoSlide() {
    this.autoSlideTimer = setInterval(() => {
      this.nextSlide();
    }, 5500);
  }

  stopAutoSlide() {
    if (this.autoSlideTimer) clearInterval(this.autoSlideTimer);
  }

  nextSlide() {
    this.currentSlide.update(idx => (idx + 1) % this.heroSlides.length);
  }

  prevSlide() {
    this.currentSlide.update(idx => (idx - 1 + this.heroSlides.length) % this.heroSlides.length);
  }

  goToSlide(index: number) {
    this.currentSlide.set(index);
  }

  private startCountdown() {
    let totalSeconds = 5 * 3600 + 43 * 60 + 29;
    this.countdownInterval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        this.countdownHours.set(h.toString().padStart(2, '0'));
        this.countdownMins.set(m.toString().padStart(2, '0'));
        this.countdownSecs.set(s.toString().padStart(2, '0'));
      }
    }, 1000);
  }
}
