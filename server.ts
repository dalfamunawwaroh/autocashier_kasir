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

console.log(">>> SERVER VERSION: 3.0 (Local Fallback Implementation) <<<");

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  console.log("Database: Supabase (PostgreSQL)");

  // --- API ROUTES ---

  // 1. Authentication Logic
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const { data: user, error } = await supabase.from('users').select('*').eq('username', username).single();
      if (error || !user) return res.status(401).json({ success: false, message: "Invalid credentials" });
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(401).json({ success: false, message: "Invalid credentials" });
      res.json({ success: true, user: { id: user.id, name: user.full_name, role: user.role, username: user.username } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 2. Product Search
  app.get("/api/products/search", async (req, res) => {
    try {
      const { label } = req.query;
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .or(`ai_label.eq."${label}",sku.eq."${label}",name.ilike."%${label}%"`)
        .single();
      if (error || !product) return res.status(404).json({ success: false, message: "Product not found" });
      res.json({ success: true, product });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 3. AI Detection Endpoint (Roboflow Inference API - autocashier/1)
  app.post("/api/detect", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ success: false, message: "No image provided" });

      const base64Data = image.includes(",") ? image.split(",")[1] : image;
      let predictions: any[] = [];
      let source = "none";

      // Roboflow Inference API — model: autocashier/1 (YOLOv11 Nano)
      try {
        const roboflowKey = process.env.ROBOFLOW_API_KEY || "EwaPmMe1RnCnJOGXsjYr";
        const modelId      = "autocashier";
        const modelVersion = "1";
        const roboflowUrl  = `https://detect.roboflow.com/${modelId}/${modelVersion}?api_key=${roboflowKey}`;

        console.log(`[AI] Calling Roboflow Inference API: ${modelId}/${modelVersion}...`);
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(roboflowUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: base64Data,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          predictions = result.predictions || [];
          if (predictions.length > 0) source = "roboflow";
        } else {
          const errText = await response.text();
          console.warn(`[AI] Roboflow failed (${response.status}): ${errText}`);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.error("[AI] Roboflow timeout");
        } else {
          console.error("[AI] Roboflow error:", err);
        }
      }

      if (predictions.length > 0) {
        // Ambil prediksi dengan confidence tertinggi
        const primary = predictions.sort((a: any, b: any) => b.confidence - a.confidence)[0];
        const label   = primary.class as string;

        console.log(`[AI] Detected [${source}]: ${label} (${(primary.confidence * 100).toFixed(1)}%)`);

        // Cari produk di Supabase berdasarkan ai_label, SKU, atau nama
        const { data: product } = await supabase
          .from("products")
          .select("*")
          .or(`ai_label.eq."${label}",sku.eq."${label}",name.ilike."%${label}%"`)
          .maybeSingle();

        // Hitung koordinat bounding box
        const x1   = primary.x - primary.width  / 2;
        const y1   = primary.y - primary.height / 2;
        const x2   = primary.x + primary.width  / 2;
        const y2   = primary.y + primary.height / 2;
        const bbox = [x1, y1, x2, y2];

        return res.json({
          success: true,
          product,
          bbox,
          confidence: primary.confidence,
          source,
          label
        });
      }

      res.json({ success: false, message: "No objects detected" });
    } catch (error) {
      console.error("Detection error:", error);
      res.status(500).json({ success: false, message: "Detection system error" });
    }
  });

  // 4. Products List
  app.get("/api/products", async (req, res) => {
    try {
      const { data: products, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      res.json({ success: true, products });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 5. Checkout
  app.post("/api/checkout", async (req, res) => {
    try {
      const { header, items } = req.body;
      const { data: transaction, error: txError } = await supabase.from('transactions').insert([{
        invoice_number: header.invoice_number,
        total_price: header.total_price,
        payment_method: header.payment_method,
        cash_received: header.cash_received,
        cash_return: header.cash_return,
        cashier_name: header.cashier_name
      }]).select().single();
      if (txError) throw txError;

      for (const item of items) {
        await supabase.from('transaction_items').insert([{
          transaction_id: transaction.id,
          product_id: item.id || item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal
        }]);

        const { data: product } = await supabase.from('products').select('stock').eq('id', item.id || item.product_id).single();
        if (product) {
          await supabase.from('products').update({ stock: product.stock - item.quantity }).eq('id', item.id || item.product_id);
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

  // 6. Analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const { data: transactions, error } = await supabase.from('transactions').select('*, transaction_items(*)');
      if (error) throw error;
      let totalRevenue = transactions.reduce((acc, t) => acc + Number(t.total_price), 0);
      res.json({ success: true, data: { total_revenue: totalRevenue, total_orders: transactions.length, aov: transactions.length > 0 ? (totalRevenue / transactions.length) : 0 } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Vite / Static Assets
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa", root: __dirname });
      app.use(vite.middlewares);
      console.log("Vite: Middleware initialized");
    } catch (e) {
      console.error("Vite initialization failed:", e);
      throw e;
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  // Dynamic Port Startup
  const startListen = (port: number) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`
🚀 AUTO-CASHIER BACKEND RUNNING
------------------------------------
URL: http://localhost:${port}
Mode: ${process.env.NODE_ENV || 'development'}
------------------------------------
`);
    });

    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.warn(`⚠️  Port ${port} is busy, trying ${port + 1}...`);
        startListen(port + 1);
      } else {
        console.error("❌ Server Error:", e);
      }
    });
  };

  startListen(parseInt(process.env.PORT || "3001"));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
