import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { supabase } from "./src/lib/supabase.js";
import bcrypt from "bcryptjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  console.log("==========================================");
  console.log("Using Supabase (PostgreSQL) as Database Provider");
  console.log("==========================================");

  // API Routes

  // 1. Authentication Logic (Login)
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      res.json({
        success: true,
        user: { id: user.id, name: user.full_name, role: user.role, username: user.username }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 1b. Authentication Logic (Register)
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password, full_name, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from('users')
        .insert([{ 
          username, 
          email, 
          password: hashedPassword, 
          full_name, 
          role: role || 'kasir' 
        }])
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        user: { id: data.id, name: data.full_name, role: data.role, username: data.username }
      });
    } catch (error: any) {
      console.error("Register error:", error);
      res.status(400).json({ success: false, message: error.message || "Registration failed" });
    }
  });

  // 1c. Request Password Reset (Simplified)
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const token = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error } = await supabase
        .from('users')
        .update({ reset_token: token })
        .eq('email', email);

      if (error) throw error;
      res.json({ success: true, message: "Reset token generated", token });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 2. AI Scanning & Cart Logic (Product Search)
  app.get("/api/products/search", async (req, res) => {
    try {
      const { label } = req.query;
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .or(`ai_label.eq."${label}",sku.eq."${label}"`)
        .single();

      if (error || !product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      res.json({ success: true, product });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 2b. Get All Products
  app.get("/api/products", async (req, res) => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      res.json({ success: true, products });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 3. Payment & Checkout Logic
  app.post("/api/checkout", async (req, res) => {
    try {
      const { header, items } = req.body;

      // 1. Create Transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert([{
          invoice_number: header.invoice_number,
          total_price: header.total_price,
          payment_method: header.payment_method,
          cash_received: header.cash_received,
          cash_return: header.cash_return,
          cashier_name: header.cashier_name
        }])
        .select()
        .single();

      if (txError) throw txError;

      // 2. Create Transaction Items & Update Stock
      for (const item of items) {
        // Add to transaction_items
        await supabase.from('transaction_items').insert([{
          transaction_id: transaction.id,
          product_id: item.id || item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal
        }]);

        // Update Stock
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id || item.product_id)
          .single();

        if (product) {
          const newStock = product.stock - item.quantity;
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.id || item.product_id);

          // Log inventory
          await supabase.from('inventory_logs').insert([{
            product_id: item.id || item.product_id,
            type: 'out',
            quantity: item.quantity,
            note: 'sale',
            logged_by: header.cashier_name || 'System',
            reason: 'sale',
            invoice_number: header.invoice_number
          }]);
        }
      }

      res.json({ success: true, transaction });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ success: false, message: "Checkout failed" });
    }
  });

  // 4. Store Settings
  app.get("/api/store-settings", async (req, res) => {
    try {
      const { data, error } = await supabase.from('settings').select('*').limit(1).single();
      res.json({ success: true, settings: data || { store_name: "AutoCashier" } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 5. Analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*, transaction_items(*)');

      if (error) throw error;

      let totalRevenue = 0;
      let totalOrders = transactions.length;
      
      transactions.forEach(t => {
        totalRevenue += Number(t.total_price);
      });

      res.json({
        success: true,
        data: {
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          aov: totalOrders > 0 ? (totalRevenue / totalOrders) : 0,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
