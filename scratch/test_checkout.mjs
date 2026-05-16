import fetch from 'node-fetch';

const payload = {
  header: {
    invoice_number: `INV-${Date.now()}`,
    total_price: 10000,
    payment_method: 'QRIS',
    cash_received: 10000,
    cash_return: 0,
    cashier_name: 'AutoCashier',
    member_id: null,
    promo_id: null,
    points_used: 0
  },
  items: [
    {
      id: "some-uuid-if-needed", // wait, I don't have a valid product ID. Let's see if transaction insert fails first.
      name: "Test Item",
      price: 10000,
      quantity: 1,
      subtotal: 10000
    }
  ],
  receiptBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAZABkAAD..."
};

async function testCheckout() {
  try {
    const res = await fetch('http://localhost:3001/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testCheckout();
