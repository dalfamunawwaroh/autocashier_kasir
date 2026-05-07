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

  // 3. AI Detection Endpoint — Roboflow YOLO v8n
  app.post("/api/detect", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ success: false, message: "No image provided" });

      // Strip data URI prefix if present
      const base64Data = image.includes(",") ? image.split(",")[1] : image;
      const roboflowKey = process.env.ROBOFLOW_API_KEY;

      if (!roboflowKey) {
        console.error("[AI] ROBOFLOW_API_KEY is not set!");
        return res.status(500).json({ success: false, message: "API key not configured" });
      }

      let predictions: any[] = [];
      let source = "none";
      let rawResponse: any = null;

      // --- Try Roboflow Detect API (simpler, direct model endpoint) ---
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        // Use the Roboflow Hosted Inference API
        // Format: POST https://detect.roboflow.com/{model_id}/{version}?api_key={key}
        // Body: raw base64 string with Content-Type: application/x-www-form-urlencoded
        const detectUrl = `https://detect.roboflow.com/autocashier/1?api_key=${roboflowKey}`;
        console.log(`[AI] POST ${detectUrl.replace(roboflowKey, '***')} (${(base64Data.length / 1024).toFixed(0)}KB)`);

        const response = await fetch(detectUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: base64Data,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        rawResponse = await response.json();
        console.log(`[AI] Response status: ${response.status}, predictions: ${rawResponse?.predictions?.length || 0}`);

        if (response.ok && rawResponse.predictions) {
          predictions = rawResponse.predictions;
          if (predictions.length > 0) source = "roboflow-detect";
        } else {
          console.warn(`[AI] Roboflow response:`, JSON.stringify(rawResponse).substring(0, 500));
        }
      } catch (err: any) {
        console.error(`[AI] Roboflow error: ${err.name === 'AbortError' ? 'TIMEOUT' : err.message}`);
      }

      // --- If direct detect failed, try Workflow API as fallback ---
      if (predictions.length === 0 && process.env.ROBOFLOW_WORKFLOW_URL) {
        try {
          const workflowUrl = process.env.ROBOFLOW_WORKFLOW_URL;
          console.log(`[AI] Trying Workflow API fallback...`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const response = await fetch(workflowUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: roboflowKey,
              inputs: {
                image: { type: "base64", value: base64Data }
              }
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          const result = await response.json();
          console.log(`[AI] Workflow response status: ${response.status}`);

          if (response.ok) {
            // Workflow returns nested structure
            const outputs = result.outputs || result;
            if (Array.isArray(outputs)) {
              const first = outputs[0];
              predictions = first?.predictions?.predictions || first?.model_predictions?.predictions || first?.predictions || [];
            } else if (outputs.predictions) {
              predictions = outputs.predictions;
            }
            if (predictions.length > 0) source = "roboflow-workflow";
          }
        } catch (err: any) {
          console.error(`[AI] Workflow fallback error: ${err.message}`);
        }
      }

      // --- Process predictions ---
      if (predictions.length > 0) {
        // Sort by confidence, take the best
        const primary = predictions.sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0))[0];
        const label = (primary.class || primary.label || "unknown") as string;
        const confidence = primary.confidence || 0;

        console.log(`[AI] ✅ Best: "${label}" (${(confidence * 100).toFixed(1)}%) [${source}]`);

        // Calculate bounding box (Roboflow returns center-x, center-y, width, height)
        const x1 = (primary.x || 0) - (primary.width || 0) / 2;
        const y1 = (primary.y || 0) - (primary.height || 0) / 2;
        const x2 = (primary.x || 0) + (primary.width || 0) / 2;
        const y2 = (primary.y || 0) + (primary.height || 0) / 2;

        // Search product in Supabase
        let product = null;
        try {
          const { data } = await supabase
            .from("products")
            .select("*")
            .or(`ai_label.eq.${label},sku.eq.${label},name.ilike.%${label}%`)
            .maybeSingle();
          product = data;
          if (product) {
            console.log(`[AI] 📦 Found in DB: "${product.name}" (Rp${product.price})`);
          } else {
            console.log(`[AI] ⚠️ No product in DB for label "${label}"`);
          }
        } catch (dbErr) {
          console.error("[AI] DB lookup error:", dbErr);
        }

        return res.json({
          success: true,
          product,
          bbox: [x1, y1, x2, y2],
          confidence,
          source,
          label
        });
      }

      // Nothing detected
      console.log(`[AI] — No detections`);
      res.json({ success: false, message: "No objects detected" });
    } catch (error) {
      console.error("[AI] Detection endpoint error:", error);
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
