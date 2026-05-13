import { supabase } from './src/lib/supabase.js';

const products = [
  {
    name: 'Cimory Yogurt Bites Strawberry',
    price: 12000,
    stock: 50,
    ai_label: 'cimory_yogurt_bites',
    category: 'Snack',
    sku: 'CMY-001'
  },
  {
    name: 'Pop Mie Rasa Ayam',
    price: 6500,
    stock: 100,
    ai_label: 'pop_mie',
    category: 'Instant Food',
    sku: 'PM-001'
  },
  {
    name: 'Le Minerale 600ml',
    price: 4000,
    stock: 200,
    ai_label: 'le_minerale',
    category: 'Drink',
    sku: 'LM-001'
  },
  {
    name: 'Aqua 600ml',
    price: 3500,
    stock: 200,
    ai_label: 'aqua_600ml',
    category: 'Drink',
    sku: 'AQ-001'
  }
];

async function seed() {
  console.log('Seeding products...');
  const { data, error } = await supabase.from('products').insert(products).select();
  if (error) {
    console.error('Error seeding products:', error);
  } else {
    console.log('Seeded successfully:', data.length, 'products');
  }
  process.exit(0);
}

seed();
