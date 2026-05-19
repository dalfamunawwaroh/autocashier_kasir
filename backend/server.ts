import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { supabase } from "../frontend/src/lib/supabase.js";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const VISION_SERVER_URL = process.env.VISION_SERVER_URL || "http://localhost:5002";
const SERVER_PORT = parseInt(process.env.PORT || "3001");
const POINTS_EARN_RATE = 0.01; // 1% of total paid

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Resolve the best product image URL by prioritizing the "front" angle
 * from the `product_images` table, falling back to the first available image.
 */
async function resolveProductImageUrl(product: any): Promise<string | null> {
  try {
    const { data: frontImg } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", product.id)
      .eq("angle", "front")
      .maybeSingle();

    if (frontImg) return frontImg.image_url;

    if (!product.image_url) {
      const { data: firstImg } = await supabase
        .from("product_images")
        .select("image_url")
        .eq("product_id", product.id)
        .limit(1);
      if (firstImg && firstImg.length > 0) return firstImg[0].image_url;
    }
  } catch (err) {
    console.warn("[VISION] product_images lookup failed:", err);
  }
  return product.image_url || null;
}

/**
 * Upload a base64-encoded receipt image to Supabase Storage.
 * Returns the public URL on success, or null on failure.
 */
async function uploadReceiptImage(base64: string, invoiceNumber: string): Promise<string | null> {
  try {
    const rawBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(rawBase64, 'base64');
    const fileName = `receipt-${invoiceNumber}-${Date.now()}.jpg`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) {
      console.error("[CHECKOUT] Failed to upload receipt:", uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(uploadData.path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("[CHECKOUT] Error processing receipt image:", err);
    return null;
  }
}

/**
 * Process loyalty points for a member after checkout:
 * marks promo as used, calculates earned points, updates balance, logs transactions.
 */
async function processLoyaltyPoints(
  memberId: string,
  transactionId: string,
  invoiceNumber: string,
  totalPaid: number,
  pointsUsed: number,
  promoId?: string
): Promise<void> {
  // Mark promo as used
  if (promoId) {
    await supabase.from('member_promos').update({ is_used: true }).eq('id', promoId);
  }

  const earnedPoints = Math.floor(totalPaid * POINTS_EARN_RATE);

  // Fetch current balance
  const { data: currentPoints } = await supabase
    .from('member_points')
    .select('balance')
    .eq('user_id', memberId)
    .maybeSingle();

  const currentBalance = currentPoints?.balance || 0;
  const newBalance = Math.max(0, currentBalance - pointsUsed + earnedPoints);

  // Upsert member points balance
  await supabase.from('member_points').upsert(
    { user_id: memberId, balance: newBalance, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );

  // Log point transactions
  const pointLogs: any[] = [];
  if (pointsUsed > 0) {
    pointLogs.push({
      user_id: memberId, transaction_id: transactionId, type: 'redeem',
      points: -pointsUsed, note: `Poin digunakan untuk transaksi ${invoiceNumber}`
    });
  }
  if (earnedPoints > 0) {
    pointLogs.push({
      user_id: memberId, transaction_id: transactionId, type: 'earn',
      points: earnedPoints, note: `1% dari Rp${totalPaid.toLocaleString('id-ID')}`
    });
  }
  if (pointLogs.length > 0) {
    await supabase.from('point_transactions').insert(pointLogs);
  }

  console.log(`[LOYALTY] Member ${memberId}: -${pointsUsed}pts (redeem) +${earnedPoints}pts (earn) → balance=${newBalance}pts`);
}

// ─────────────────────────────────────────────
// Server Bootstrap
// ─────────────────────────────────────────────

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // ─── Auth ──────────────────────────────────

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
          id: user.id, name: user.full_name, role: user.role, username: user.username,
          branch_id: user.branch_id, branch_code: branchCode, branch_name: branchName
        }
      });
    } catch (error) {
      console.error("[AUTH] Login error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // ─── Products ──────────────────────────────

  app.get("/api/products", async (_req, res) => {
    try {
      const { data: products, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      res.json({ success: true, products });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

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

  // ─── AI Detection (YOLO-World + DINOv2 via Python vision server) ───

  app.post("/api/detect", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ success: false, message: "No image provided" });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const visionRes = await fetch(`${VISION_SERVER_URL}/detect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const visionData = await visionRes.json();

        if (visionRes.ok && visionData.success) {
          const { label, confidence, similarity, bbox, source } = visionData;
          console.log(`[VISION] ✅ Detected '${label}' conf=${(confidence * 100).toFixed(1)}% sim=${similarity?.toFixed(2)} [${source}]`);

          // Enrich detection result with product data from Supabase
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
                product.image_url = await resolveProductImageUrl(product);
                console.log(`[VISION] 📦 Supabase: '${product.name}' Rp${product.price}`);
              }
            } catch (dbErr) {
              console.warn("[VISION] DB lookup failed:", dbErr);
            }
          }

          return res.json({ success: true, source, label, confidence, similarity, bbox, product });
        }

        // Vision server responded but found nothing
        return res.json({
          success: false,
          message: visionData.message || "Tidak ada objek terdeteksi",
          source: "yolo+dino"
        });
      } catch (visionErr: any) {
        const isTimeout = visionErr.name === "AbortError";
        const msg = isTimeout
          ? "Vision server timeout — pastikan vision server sudah berjalan"
          : "Vision server tidak dapat dijangkau — jalankan: npm run vision";
        console.warn(`[VISION] ❌ ${msg}`);
        return res.status(503).json({ success: false, message: msg, source: "vision-server-offline" });
      }
    } catch (error) {
      console.error("[DETECT] Detection endpoint error:", error);
      res.status(500).json({ success: false, message: "Detection system error" });
    }
  });

  // ─── Vision Server Proxy Routes ────────────

  app.post("/api/vision/register", async (req, res) => {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 60000);
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

  app.get("/api/vision/products", async (_req, res) => {
    try {
      const visionRes = await fetch(`${VISION_SERVER_URL}/products`);
      const data = await visionRes.json();
      res.json(data);
    } catch (err: any) {
      res.status(503).json({ success: false, message: `Vision server unreachable: ${err.message}` });
    }
  });

  app.delete("/api/vision/products/:id", async (req, res) => {
    try {
      const visionRes = await fetch(`${VISION_SERVER_URL}/products/${req.params.id}`, { method: "DELETE" });
      const data = await visionRes.json();
      res.status(visionRes.ok ? 200 : 404).json(data);
    } catch (err: any) {
      res.status(503).json({ success: false, message: `Vision server unreachable: ${err.message}` });
    }
  });

  app.get("/api/vision/health", async (_req, res) => {
    try {
      const visionRes = await fetch(`${VISION_SERVER_URL}/health`, { signal: AbortSignal.timeout(3000) });
      const data = await visionRes.json();
      res.json({ ...data, vision_server: "online" });
    } catch {
      res.json({ status: "degraded", vision_server: "offline", message: "Run: python vision_server.py" });
    }
  });

  app.post("/api/vision/sync", async (req, res) => {
    try {
      const shouldWait = req.query.wait === "true";
      const endpoint = shouldWait ? "/sync/wait" : "/sync";
      const controller = new AbortController();
      setTimeout(() => controller.abort(), shouldWait ? 120000 : 5000);
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

  // ─── Checkout ──────────────────────────────

  app.post("/api/checkout", async (req, res) => {
    try {
      const { header, items, receiptBase64 } = req.body;

      const invoiceNumber = header.invoice_number || `AC-${Date.now()}`;
      const receiptUrl = receiptBase64 ? await uploadReceiptImage(receiptBase64, invoiceNumber) : null;

      // Insert transaction header
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

      // Insert line items and decrement stock
      for (const item of items) {
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

      // Process loyalty points if member transaction
      if (header.member_id) {
        await processLoyaltyPoints(
          header.member_id,
          transaction.id,
          invoiceNumber,
          Number(header.total_price),
          Number(header.points_used || 0),
          header.promo_id
        );
      }

      res.json({ success: true, transaction });
    } catch (error: any) {
      console.error("[CHECKOUT] Error:", error);
      res.status(500).json({ success: false, message: "Checkout failed", error: error?.message || String(error) });
    }
  });

  // ─── Members ───────────────────────────────

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
          success: true, isMember: true,
          user: { id: member.id, name: member.full_name, role: member.role, phone: member.whatsapp }
        });
      } else {
        res.json({ success: true, isMember: false, message: "Member tidak ditemukan" });
      }
    } catch (error) {
      console.error("[MEMBER] Check error:", error);
      res.status(500).json({ success: false, message: "Gagal memeriksa keanggotaan" });
    }
  });

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
      console.error("[MEMBER] Get promos error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil promo", error: error.message });
    }
  });

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
      console.error("[MEMBER] Get points error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil poin", error: error.message });
    }
  });

  // ─── Analytics & Branches ──────────────────

  app.get("/api/analytics", async (_req, res) => {
    try {
      const { data: transactions, error } = await supabase.from('transactions').select('*, transaction_items(*)');
      if (error) throw error;

      const totalRevenue = transactions.reduce((acc, t) => acc + Number(t.total_price), 0);
      const totalOrders = transactions.length;

      res.json({
        success: true,
        data: {
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          aov: totalOrders > 0 ? totalRevenue / totalOrders : 0
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.get("/api/branches", async (_req, res) => {
    try {
      const { data: branches, error } = await supabase.from('branches').select('id, name, code').eq('is_active', true);
      if (error) throw error;
      res.json({ success: true, data: branches });
    } catch (error) {
      console.error("[BRANCHES] Fetch error:", error);
      res.status(500).json({ success: false, message: "Failed to load branches" });
    }
  });

  // ─── Vite / Static Assets ──────────────────

  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
        root: path.join(__dirname, '../frontend')
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Vite initialization failed:", e);
      throw e;
    }
  } else {
    const distPath = path.join(process.cwd(), 'frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  // ─── Start Listening ───────────────────────

  const startListen = (port: number) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`\n🚀 AUTO-CASHIER BACKEND RUNNING\n   URL:  http://localhost:${port}\n   Mode: ${process.env.NODE_ENV || 'development'}\n`);
    });

    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.warn(`⚠️  Port ${port} busy, trying ${port + 1}…`);
        startListen(port + 1);
      } else {
        console.error("❌ Server Error:", e);
      }
    });
  };

  startListen(SERVER_PORT);
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
