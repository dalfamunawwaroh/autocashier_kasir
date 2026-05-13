import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { supabase } from "../frontend/src/lib/supabase.js";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(">>> SERVER VERSION: 4.0 (YOLO-World + DINOv2 Vision Pipeline) <<<");

const VISION_SERVER_URL = process.env.VISION_SERVER_URL || "http://localhost:5002";

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Expose local upload folder so vision_server.py can download product images
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

  // 3. AI Detection Endpoint — YOLO-World + DINOv2 (via Python vision server)
  app.post("/api/detect", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ success: false, message: "No image provided" });

      // ── Vision Server (YOLO-World + DINOv2) — satu-satunya sumber deteksi ──
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        console.log(`[VISION] Sending frame to vision server…`);
        const visionRes = await fetch(`${VISION_SERVER_URL}/detect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const visionData = await visionRes.json();

        if (visionRes.ok && visionData.success) {
          const label      = visionData.label as string;
          const confidence = visionData.confidence as number;
          const similarity = visionData.similarity as number;
          const bbox       = visionData.bbox as number[];
          const source     = visionData.source as string;

          console.log(`[VISION] ✅ Detected '${label}' conf=${(confidence*100).toFixed(1)}% sim=${similarity?.toFixed(2)} [${source}]`);

          // Enrich with Supabase product data
          let product = visionData.product || null;
          const productId = visionData.product_id || null;

          if (!product?.price && label) {
            try {
              const query = productId
                ? supabase.from("products").select("*").eq("id", productId).maybeSingle()
                : supabase.from("products").select("*")
                    .or(`ai_label.eq.${label},sku.eq.${label},name.ilike.%${label}%`)
                    .maybeSingle();
              const { data } = await query;
              if (data) {
                product = data;
                console.log(`[VISION] 📦 Supabase: '${product.name}' Rp${product.price}`);
              }
            } catch (dbErr) {
              console.warn("[VISION] DB lookup failed:", dbErr);
            }
          }

          return res.json({ success: true, source, label, confidence, similarity, bbox, product });
        }

        // Vision server responded but no detection
        console.log(`[VISION] No detection: ${visionData.message || "unknown"}`);
        return res.json({ success: false, message: visionData.message || "Tidak ada objek terdeteksi", source: "yolo+dino" });

      } catch (visionErr: any) {
        const isTimeout = visionErr.name === "AbortError";
        const msg = isTimeout
          ? "Vision server timeout — pastikan vision server sudah berjalan"
          : "Vision server tidak dapat dijangkau — jalankan: npm run dev:all";
        console.warn(`[VISION] ❌ ${msg}`);
        return res.status(503).json({ success: false, message: msg, source: "vision-server-offline" });
      }

    } catch (error) {
      console.error("[AI] Detection endpoint error:", error);
      res.status(500).json({ success: false, message: "Detection system error" });
    }
  });


  // 3b. Vision Server — Register product reference images
  app.post("/api/vision/register", async (req, res) => {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 60000); // longer timeout for multiple images
      const visionRes = await fetch(`${VISION_SERVER_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
        signal: controller.signal,
      });
      const data = await visionRes.json();
      res.status(visionRes.ok ? 200 : 500).json(data);
    } catch (err: any) {
      res.status(503).json({ success: false, message: `Vision server unreachable: ${err.message}` });
    }
  });

  // 3c. Vision Server — List registered products
  app.get("/api/vision/products", async (req, res) => {
    try {
      const visionRes = await fetch(`${VISION_SERVER_URL}/products`);
      const data = await visionRes.json();
      res.json(data);
    } catch (err: any) {
      res.status(503).json({ success: false, message: `Vision server unreachable: ${err.message}` });
    }
  });

  // 3d. Vision Server — Delete a product from vision DB
  app.delete("/api/vision/products/:id", async (req, res) => {
    try {
      const visionRes = await fetch(`${VISION_SERVER_URL}/products/${req.params.id}`, { method: "DELETE" });
      const data = await visionRes.json();
      res.status(visionRes.ok ? 200 : 404).json(data);
    } catch (err: any) {
      res.status(503).json({ success: false, message: `Vision server unreachable: ${err.message}` });
    }
  });

  // 3e. Vision Server — Health check
  app.get("/api/vision/health", async (req, res) => {
    try {
      const visionRes = await fetch(`${VISION_SERVER_URL}/health`, { signal: AbortSignal.timeout(3000) });
      const data = await visionRes.json();
      res.json({ ...data, vision_server: "online" });
    } catch {
      res.json({ status: "degraded", vision_server: "offline", message: "Run: python vision_server.py" });
    }
  });

  // 3f. Vision Server — Sync produk dari Supabase (trigger manual)
  app.post("/api/vision/sync", async (req, res) => {
    try {
      const wait = req.query.wait === "true";
      const endpoint = wait ? "/sync/wait" : "/sync";
      const controller = new AbortController();
      setTimeout(() => controller.abort(), wait ? 120000 : 5000);
      const visionRes = await fetch(`${VISION_SERVER_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      const data = await visionRes.json();
      res.json(data);
    } catch (err: any) {
      res.status(503).json({ success: false, message: `Vision server unreachable: ${err.message}` });
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
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa", root: path.join(__dirname, '../frontend') });
      app.use(vite.middlewares);
      console.log("Vite: Middleware initialized");
    } catch (e) {
      console.error("Vite initialization failed:", e);
      throw e;
    }
  } else {
    const distPath = path.join(process.cwd(), 'frontend/dist');
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
