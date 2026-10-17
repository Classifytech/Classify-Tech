export interface LootDeal {
  id: string;
  store: string;
  title: string;
  desc: string;
  price: string;
  mrp: string;
  discount: string;
  img: string;
  url: string;
  badge: string;
}

export const defaultLootDeals: LootDeal[] = [
  {
    id: 'loot-slot-1',
    store: 'FLIPKART VERIFIED MEGA DEAL',
    title: 'POCO X6 Pro 5G (12GB RAM, 512GB ROM) — Flagship Killer Price Drop',
    desc: 'Dimensity 8300-Ultra (4nm), 1.46M+ AnTuTu v10, 1.5K 120Hz Flow AMOLED, UFS 4.0 Storage.',
    price: '₹22,999',
    mrp: '₹30,999',
    discount: '25% OFF',
    img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
    url: 'https://www.flipkart.com',
    badge: 'DEAL #1 • POPULAR'
  },
  {
    id: 'loot-slot-2',
    store: 'AMAZON VERIFIED LOOT DROP',
    title: 'iQOO Neo 9 Pro 5G / Premium TWS & Smart Tech — Bank Discount Offer',
    desc: 'Snapdragon 8 Gen 2 Flagship + Q1 Supercomputing Chip, 144Hz LTPO AMOLED, 120W FlashCharge.',
    price: '₹31,999',
    mrp: '₹39,999',
    discount: '20% OFF',
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
    url: 'https://www.amazon.in',
    badge: 'DEAL #2 • LIMITED'
  }
];
