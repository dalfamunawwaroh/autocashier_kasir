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
      let branchCode = 'BDG';
      let branchName = 'Bandung';
      if (user.branch_id) {
        const { data: branch } = await supabase.from('branches').select('code, name').eq('id', user.branch_id).single();
        if (branch) {
          branchCode = branch.code;
          branchName = branch.name;
        }
      }
      
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          name: user.full_name, 
          role: user.role, 
          username: user.username, 
          branch_id: user.branch_id,
          branch_code: branchCode,
          branch_name: branchName
        } 
      });
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

          if (label) {
            try {
              const query = productId
                ? supabase.from("products").select("*").eq("id", productId).maybeSingle()
                : supabase.from("products").select("*")
                    .or(`ai_label.eq.${label},sku.eq.${label},name.ilike.%${label}%`)
                    .maybeSingle();
              const { data } = await query;
              if (data) {
                product = data;
                
                // ALWAYS prioritize the FRONT angle photo of the product if it exists in product_images
                try {
                  const { data: frontImg } = await supabase
                    .from("product_images")
                    .select("image_url")
                    .eq("product_id", product.id)
                    .eq("angle", "front")
                    .maybeSingle();
                  if (frontImg) {
                    product.image_url = frontImg.image_url;
                    console.log(`[VISION] 📦 Prioritized front image_url from product_images: ${product.image_url}`);
                  } else if (!product.image_url) {
                    // Fall back to first image from product_images if main image_url is empty
                    const { data: imgData } = await supabase
                      .from("product_images")
                      .select("image_url")
                      .eq("product_id", product.id)
                      .limit(1);
                    if (imgData && imgData.length > 0) {
                      product.image_url = imgData[0].image_url;
                      console.log(`[VISION] 📦 Fallback first image_url from product_images: ${product.image_url}`);
                    }
                  }
                } catch (imgErr) {
                  console.warn("[VISION] product_images lookup failed:", imgErr);
                }
                
                console.log(`[VISION] 📦 Supabase: '${product.name}' Rp${product.price} | image_url: ${product.image_url}`);
              }
            } catch (dbErr) {
              console.warn("[VISION] DB lookup failed:", dbErr);
            }
          }

          console.log(`[API DETECT] Returning product payload:`, product);
          return res.json({ success: true, source, label, confidence, similarity, bbox, product });
        }

        // Vision server responded but no detection
        console.log(`[VISION] No detection: ${visionData.message || "unknown"}`);
        return res.json({ success: false, message: visionData.message || "Tidak ada objek terdeteksi", source: "yolo+dino" });

      } catch (visionErr: any) {
        const isTimeout = visionErr.name === "AbortError";
        const msg = isTimeout
          ? "Vision server timeout — pastikan vision server sudah berjalan"
          : "Vision server tidak dapat dijangkau — jalankan: npm run vision";
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
      const { header, items, receiptBase64 } = req.body;
      let receiptUrl = null;

      // Handle receipt image upload
      if (receiptBase64) {
        try {
          const base64Data = receiptBase64.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `receipt-${header.invoice_number}-${Date.now()}.jpg`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, buffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) {
            console.error("Failed to upload receipt:", uploadError);
          } else if (uploadData) {
            const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(uploadData.path);
            receiptUrl = publicUrlData.publicUrl;
          }
        } catch (imgErr) {
          console.error("Error processing receipt image:", imgErr);
        }
      }

      let invoiceNumber = header.invoice_number;
      if (!invoiceNumber) {
        invoiceNumber = `AC-${Date.now()}`;
      }

      const { data: transaction, error: txError } = await supabase.from('transactions').insert([{
        invoice_number: invoiceNumber,
        branch_id: header.branch_id || null,
        member_id: header.member_id || null,
        total_price: header.total_price,
        payment_method: header.payment_method,
        receipt_url: receiptUrl,
        payment_status: 'pending_verification'
      }]).select().single();
      if (txError) throw txError;

      for (const item of items) {
        // Support both `qty` (CartItem) and `quantity` (legacy) field names
        const qty = item.qty ?? item.quantity ?? 1;
        const productId = item.id || item.product_id;

        const { error: itemError } = await supabase.from('transaction_items').insert([{
          transaction_id: transaction.id,
          product_id: productId,
          unit_price: item.price,
          quantity: qty,
          subtotal: item.price * qty
        }]);

        if (itemError) {
          console.error(`[CHECKOUT] Failed to insert transaction_item for product ${productId}:`, itemError);
        }

        const { data: product } = await supabase.from('products').select('stock').eq('id', productId).single();
        if (product) {
          await supabase.from('products').update({ stock: product.stock - qty }).eq('id', productId);
        }
      }

      // --- LOYALTY POINTS SYSTEM ---
      const memberId = header.member_id as string | undefined;
      if (memberId) {
        const totalPaid = Number(header.total_price);
        const pointsUsed = Number(header.points_used || 0);
        const promoId = header.promo_id as string | undefined;

        // 1. Tandai promo sebagai sudah dipakai
        if (promoId) {
          await supabase.from('member_promos').update({ is_used: true }).eq('id', promoId);
        }

        // 2. Hitung poin yang didapat: 1% dari total yang dibayarkan (setelah diskon & redeem)
        const earnedPoints = Math.floor(totalPaid * 0.01);

        // 3. Ambil saldo poin saat ini
        const { data: currentPoints } = await supabase
          .from('member_points')
          .select('balance')
          .eq('user_id', memberId)
          .maybeSingle();

        const currentBalance = currentPoints?.balance || 0;
        const newBalance = currentBalance - pointsUsed + earnedPoints;

        // 4. Upsert saldo poin member
        await supabase.from('member_points').upsert(
          { user_id: memberId, balance: Math.max(0, newBalance), updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

        // 5. Catat transaksi poin
        const pointLogs: any[] = [];
        if (pointsUsed > 0) {
          pointLogs.push({ user_id: memberId, transaction_id: transaction.id, type: 'redeem', points: -pointsUsed, note: `Poin digunakan untuk transaksi ${header.invoice_number}` });
        }
        if (earnedPoints > 0) {
          pointLogs.push({ user_id: memberId, transaction_id: transaction.id, type: 'earn', points: earnedPoints, note: `1% dari Rp${totalPaid.toLocaleString('id-ID')}` });
        }
        if (pointLogs.length > 0) {
          await supabase.from('point_transactions').insert(pointLogs);
        }

        console.log(`[LOYALTY] Member ${memberId}: -${pointsUsed}pts (redeem) +${earnedPoints}pts (earn) → balance=${Math.max(0, newBalance)}pts`);
      }

      res.json({ success: true, transaction });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ success: false, message: "Checkout failed", error: error?.message || String(error) });
    }
  });

  // 6. Member Check
  app.post("/api/members/check", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ success: false, message: "Nomor WhatsApp diperlukan" });

      const { data: member, error } = await supabase
        .from('users')
        .select('id, full_name, role, whatsapp')
        .eq('whatsapp', phone)
        .maybeSingle();

      if (error) throw error;

      if (member) {
        res.json({ 
          success: true, 
          isMember: true, 
          user: { 
            id: member.id, 
            name: member.full_name, 
            role: member.role, 
            phone: member.whatsapp 
          } 
        });
      } else {
        res.json({ success: true, isMember: false, message: "Member tidak ditemukan" });
      }
    } catch (error) {
      console.error("Member check error:", error);
      res.status(500).json({ success: false, message: "Gagal memeriksa keanggotaan" });
    }
  });

  // 6b. Get Member Promos
  app.get("/api/members/promos", async (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ success: false, message: "user_id diperlukan" });

      const now = new Date().toISOString();
      const { data: promos, error } = await supabase
        .from('member_promos')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_used', false)
        .or(`expires_at.is.null,expires_at.gt.${now}`);

      if (error) throw error;

      res.json({ success: true, promos: promos || [] });
    } catch (error: any) {
      console.error("Get promos error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil promo", error: error.message });
    }
  });

  // 6c. Get Member Points
  app.get("/api/members/points", async (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ success: false, message: "user_id diperlukan" });

      const { data: pointsData, error } = await supabase
        .from('member_points')
        .select('balance')
        .eq('user_id', user_id)
        .maybeSingle();

      if (error) throw error;

      res.json({ success: true, balance: pointsData?.balance || 0 });
    } catch (error: any) {
      console.error("Get points error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil poin", error: error.message });
    }
  });

  // 7. Analytics
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

  // GET Branches
  app.get("/api/branches", async (req, res) => {
    try {
      const { data: branches, error } = await supabase.from('branches').select('id, name, code').eq('is_active', true);
      if (error) throw error;
      res.json({ success: true, data: branches });
    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).json({ success: false, message: "Failed to load branches" });
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
