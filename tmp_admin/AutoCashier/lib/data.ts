export interface Product {
  sku: string
  name: string
  category: string
  price: number
  stock: number
  ai_label: string
  image?: string
  image_url?: string
}

export interface Transaction {
  transaction_id: string
  timestamp: string
  items: number
  total: number
  payment_method: string
  cashier: string
}

export const products: Product[] = [
  {
    sku: "SKU001",
    name: "Indomie Goreng",
    category: "Instant Noodles",
    price: 3500,
    stock: 150,
    ai_label: "instant_noodle",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop",
  },
  {
    sku: "SKU002",
    name: "Le Minerale 600ml",
    category: "Beverages",
    price: 4000,
    stock: 85,
    ai_label: "bottled_water",
    image: "https://images.unsplash.com/photo-1554866585-54497a64547e?w=400&h=400&fit=crop",
  },
  {
    sku: "SKU003",
    name: "Beng Beng",
    category: "Snacks",
    price: 2500,
    stock: 8,
    ai_label: "chocolate_wafer",
    image: "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop",
  },
  {
    sku: "SKU004",
    name: "Cleo Water 1.5L",
    category: "Beverages",
    price: 6500,
    stock: 45,
    ai_label: "bottled_water",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop",
  },
  {
    sku: "SKU005",
    name: "Chitato Original 68g",
    category: "Snacks",
    price: 12000,
    stock: 0,
    ai_label: "potato_chips",
    image: "https://images.unsplash.com/photo-1599599810987-53f47bcad5d4?w=400&h=400&fit=crop",
  },
  {
    sku: "SKU006",
    name: "Indomie Soto",
    category: "Instant Noodles",
    price: 3500,
    stock: 120,
    ai_label: "instant_noodle",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop",
  },
  {
    sku: "SKU007",
    name: "Pocari Sweat 500ml",
    category: "Beverages",
    price: 7500,
    stock: 32,
    ai_label: "isotonic_drink",
    image: "https://images.unsplash.com/photo-1600594835543-d1f2a7a67d2c?w=400&h=400&fit=crop",
  },
  {
    sku: "SKU008",
    name: "Good Day Cappuccino",
    category: "Beverages",
    price: 5000,
    stock: 5,
    ai_label: "coffee_drink",
    image: "https://images.unsplash.com/photo-1599954120429-4bb3a7d4e6d5?w=400&h=400&fit=crop",
  },
  {
    sku: "SKU009",
    name: "Tango Wafer Coklat",
    category: "Snacks",
    price: 3000,
    stock: 67,
    ai_label: "chocolate_wafer",
    image: "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop",
  },
  {
    sku: "SKU010",
    name: "Ultra Milk 250ml",
    category: "Beverages",
    price: 5500,
    stock: 0,
    ai_label: "milk_drink",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop",
  },
  {
    sku: "SKU011",
    name: "Oreo Original",
    category: "Snacks",
    price: 8500,
    stock: 25,
    ai_label: "biscuit",
    image: "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop",
  },
  {
    sku: "SKU012",
    name: "Pop Mie Ayam",
    category: "Instant Noodles",
    price: 5500,
    stock: 40,
    ai_label: "cup_noodle",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop",
  },
]

export const transactions: Transaction[] = [
  {
    transaction_id: "TRX001",
    timestamp: "2026-03-13 09:15:23",
    items: 5,
    total: 35500,
    payment_method: "Cash",
    cashier: "Admin",
  },
  {
    transaction_id: "TRX002",
    timestamp: "2026-03-13 09:32:11",
    items: 3,
    total: 18000,
    payment_method: "QRIS",
    cashier: "Admin",
  },
  {
    transaction_id: "TRX003",
    timestamp: "2026-03-13 10:05:45",
    items: 8,
    total: 67500,
    payment_method: "Cash",
    cashier: "Admin",
  },
  {
    transaction_id: "TRX004",
    timestamp: "2026-03-13 10:22:18",
    items: 2,
    total: 11000,
    payment_method: "Debit Card",
    cashier: "Admin",
  },
  {
    transaction_id: "TRX005",
    timestamp: "2026-03-13 11:01:33",
    items: 4,
    total: 28500,
    payment_method: "QRIS",
    cashier: "Admin",
  },
  {
    transaction_id: "TRX006",
    timestamp: "2026-03-13 11:45:09",
    items: 6,
    total: 42000,
    payment_method: "Cash",
    cashier: "Admin",
  },
  {
    transaction_id: "TRX007",
    timestamp: "2026-03-13 12:15:27",
    items: 1,
    total: 7500,
    payment_method: "QRIS",
    cashier: "Admin",
  },
  {
    transaction_id: "TRX008",
    timestamp: "2026-03-13 13:30:44",
    items: 10,
    total: 89000,
    payment_method: "Cash",
    cashier: "Admin",
  },
]

export const categories = [
  "All Categories",
  "Instant Noodles",
  "Beverages",
  "Snacks",
]

export const weeklySalesData = [
  { day: "Mon", sales: 450000 },
  { day: "Tue", sales: 380000 },
  { day: "Wed", sales: 520000 },
  { day: "Thu", sales: 410000 },
  { day: "Fri", sales: 680000 },
  { day: "Sat", sales: 890000 },
  { day: "Sun", sales: 750000 },
]

export const monthlySalesData = [
  { day: "Day 1", sales: 320000 },
  { day: "Day 2", sales: 280000 },
  { day: "Day 3", sales: 410000 },
  { day: "Day 4", sales: 380000 },
  { day: "Day 5", sales: 520000 },
  { day: "Day 6", sales: 450000 },
  { day: "Day 7", sales: 680000 },
  { day: "Day 8", sales: 590000 },
  { day: "Day 9", sales: 720000 },
  { day: "Day 10", sales: 410000 },
  { day: "Day 11", sales: 390000 },
  { day: "Day 12", sales: 640000 },
  { day: "Day 13", sales: 510000 },
  { day: "Day 14", sales: 450000 },
  { day: "Day 15", sales: 760000 },
  { day: "Day 16", sales: 520000 },
  { day: "Day 17", sales: 480000 },
  { day: "Day 18", sales: 590000 },
  { day: "Day 19", sales: 670000 },
  { day: "Day 20", sales: 540000 },
  { day: "Day 21", sales: 380000 },
  { day: "Day 22", sales: 620000 },
  { day: "Day 23", sales: 710000 },
  { day: "Day 24", sales: 460000 },
  { day: "Day 25", sales: 520000 },
  { day: "Day 26", sales: 630000 },
  { day: "Day 27", sales: 480000 },
  { day: "Day 28", sales: 410000 },
  { day: "Day 29", sales: 750000 },
  { day: "Day 30", sales: 890000 },
]

export const yearlySalesData = [
  { month: "Jan", sales: 2450000 },
  { month: "Feb", sales: 2280000 },
  { month: "Mar", sales: 3450000 },
  { month: "Apr", sales: 2800000 },
  { month: "May", sales: 4200000 },
  { month: "Jun", sales: 3900000 },
  { month: "Jul", sales: 4800000 },
  { month: "Aug", sales: 3600000 },
  { month: "Sep", sales: 5100000 },
  { month: "Oct", sales: 4200000 },
  { month: "Nov", sales: 5800000 },
  { month: "Dec", sales: 6200000 },
]

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
